const lodash = require('lodash')

const dummy =(blogs) => {
    return 1
}

const totalLikes = (blogs) =>{
   const likes = blogs.reduce((acc, blog) => {return acc + blog.likes},0)

   return likes;
}

const favoriteBlog = (blogs) =>{
    if(blogs.length === 0) return null

    const favorite = blogs.reduce((maxBlog, currentBlog)=> {
        return currentBlog.likes > maxBlog.likes ? currentBlog:maxBlog 

    },blogs[0])

    return favorite
}

const mostBlogs = (blogs) => {
    if(blogs.length === 0) return null

    const authorGroups = lodash.groupBy(blogs, 'author')
    const authorCounts = lodash.map(authorGroups, (blogs, author) => ({
    author,
    blogs: blogs.length
    }))

  return lodash.maxBy(authorCounts, 'blogs')
}

const mostLikes = (blogs) => {
    if(blogs.length === 0) return null

    const authorGroups = lodash.groupBy(blogs, 'author')
    const authorLikes = lodash.map(authorGroups, (blogs,author) => ({
        author,
        likes: blogs.reduce((acc, blog) => {return acc + blog.likes},0)
    }))

    return lodash.maxBy(authorLikes, 'likes')
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}