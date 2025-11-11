const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const api = supertest(app)

let token = null

const initialBlogs = [
  {
    title: 'First test blog',
    author: 'Darius',
    url: 'http://example.com/test1',
    likes: 5,
  },
  {
    title: 'Second test blog',
    author: 'Ioan',
    url: 'http://example.com/test2',
    likes: 8,
  },
]

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)

  const passwordHash = await bcrypt.hash('testpassword', 10)

  const user = new User({ username: 'testuser', passwordHash })
  const savedUser = await user.save()

  const loginResponse = await api
    .post('/api/login')
    .send({ username: 'testuser', password: 'testpassword' })

  token = loginResponse.body.token

  const blogsWithUser = initialBlogs.map(b => ({ ...b, user: savedUser._id }))
  await Blog.insertMany(blogsWithUser)

})

test('blogs are returned as json and correct amount', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('blog posts have id proprety insted of _id', async() => {
    const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

    const blogs = response.body 

    assert.strictEqual(blogs.length > 0, true)

    blogs.forEach(blog =>{
        assert.strictEqual(blog.id !== undefined , true)
        assert.strictEqual(blog._id, undefined)
    })
})
 
test('a new blog can be created with POST request', async() =>{
    const newBlog = {
    title: 'New Blog Created by Test',
    author: 'Test Author',
    url: 'http://test.com/new-blog',
    likes: 15
  }

  const blogAtStart = await Blog.find({})
  const initialLength = blogAtStart.length

  await api 
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const blogAtEnd = await Blog.find({})
    const endLength = blogAtEnd.length
    
    assert.strictEqual(initialLength + 1, endLength)

    const titles = blogAtEnd.map(blog => blog.title)
    assert.strictEqual(titles.includes('New Blog Created by Test'), true)
} )

test('adding a blog fails with 401 if token is not provided', async () => {
  const newBlog = {
    title: 'Unauthorized Blog',
    author: 'No Token',
    url: 'http://test.com/unauthorized',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)

  const blogsAtEnd = await Blog.find({})
  const titles = blogsAtEnd.map(b => b.title)
  assert.strictEqual(titles.includes('Unauthorized Blog'), false)
})

test('a new blog create without like proprety', async()=>{
    const newBlog = {
    title: 'New Blog Created by Test',
    author: 'Test Author',
    url: 'http://test.com/new-blog'
  }

  response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const savedBlog = response.body
    
  assert.strictEqual(savedBlog.title, newBlog.title)
  assert.strictEqual(savedBlog.author, newBlog.author)
  assert.strictEqual(savedBlog.url, newBlog.url)
  assert.strictEqual(savedBlog.likes, 0)

} )

test('a new blog create withoue title or url', async()=>{
  const newBlog1 ={
    author: 'Test Author',
    likes: 2
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog1)
    .expect(400)

  const newBlog2 ={
    title: 'New Blog Created by Test',
    author: 'Test Author',
    likes: 2
  }

  await api
    .post('/api/blogs')
    .send(newBlog2)
    .expect(400)

  const newBlog3 ={
    author: 'Test Author',
    url: 'http://test.com/new-blog',
    likes: 2
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog2)
    .expect(400)

})

test('a blog can be deleted', async () => {
  const blogsAtStart = await Blog.find({})
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await Blog.find({})
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)

  const titles = blogsAtEnd.map(blog => blog.title)
  assert.strictEqual(titles.includes(blogToDelete.title), false)
})

test('deleting non-existent blog returns 404', async () => {
  const validNonExistingId = new mongoose.Types.ObjectId()
  
  await api
    .delete(`/api/blogs/${validNonExistingId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
})

test('deleting with invalid id format returns 400', async () => {
  const invalidId = 'invalid-id-format'
  
  await api
    .delete(`/api/blogs/${invalidId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(400)
})

test('blog likes can be updated', async () => {
  const blogsAtStart = await Blog.find({})
  const blogToUpdate = blogsAtStart[0]

  const updatedData = {
    title: blogToUpdate.title,
    author: blogToUpdate.author,
    url: blogToUpdate.url,
    likes: blogToUpdate.likes + 10
  }

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updatedData)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const updatedBlog = response.body
  assert.strictEqual(updatedBlog.likes, blogToUpdate.likes + 10)
  assert.strictEqual(updatedBlog.title, blogToUpdate.title)
  assert.strictEqual(updatedBlog.author, blogToUpdate.author)
  assert.strictEqual(updatedBlog.url, blogToUpdate.url)
})

test('updating non-existent blog returns 404', async () => {
  const validNonExistingId = new mongoose.Types.ObjectId()
  const updateData = {
    title: 'Test Title',
    author: 'Test Author',
    url: 'http://test.com',
    likes: 5
  }

  await api
    .put(`/api/blogs/${validNonExistingId}`)
    .send(updateData)
    .expect(404)
})

test('updating with invalid id format returns 400', async () => {
  const invalidId = 'invalid-id-format'
  const updateData = {
    title: 'Test Title',
    author: 'Test Author',
    url: 'http://test.com',
    likes: 5
  }

  await api
    .put(`/api/blogs/${invalidId}`)
    .send(updateData)
    .expect(400)
})

after(async () => {
  await mongoose.connection.close()
})