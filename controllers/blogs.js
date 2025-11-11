const blogsRouter = require('express').Router()
const { request, response } = require('../app')
const mongoose = require('mongoose')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { error } = require('../utils/logger')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
                          .populate('user', { username: 1, name: 1 })
  response.json(blogs)
  
})

blogsRouter.post('/',userExtractor, async (request, response) => {
  try{
  const body  = request.body
  const user = request.user

    const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  })


  const savedBlog = await blog.save()

  response.status(201).json(savedBlog)
}catch(error){
    response.status(400).json({ error: error.message })
}
})

blogsRouter.delete('/:id',userExtractor, async (request, response) => {
  try{
    const blogId = request.params.id
    const user = request.user

  if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return response.status(400).json({ error: 'Invalid ID format' })
    }

  const blog = await Blog.findById(blogId)
  
  if(!blog){
    return response.status(400).json({error: 'Blog not found'})
  }

      if (!blog.user) {
      return response.status(400).json({ error: 'Blog has no associated user' })
    }

  if(blog.user.toString() !== user._id.toString()){
    return response.status(403).json({ error: 'Permission denied: only the creator can delete this blog' })
  }

  const result = await Blog.findByIdAndDelete(blogId)

  if (!result) {
    return response.status(404).json({ error: 'Blog not found' })
  }
    
    response.status(204).end()
  } catch (error) {
    response.status(500).json({ error: 'Internal server error' })
  }
})

blogsRouter.put('/:id', async (request, response) => {
  try {
    const id = request.params.id
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return response.status(400).json({ error: 'Invalid ID format' })
    }

    const { title, author, url, likes } = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, author, url, likes },
      { new: true, runValidators: true, context: 'query' }
    )

    if (!updatedBlog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    response.json(updatedBlog)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})



module.exports = blogsRouter