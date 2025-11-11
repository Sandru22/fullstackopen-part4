const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})
})

test('users are returned with blog information', async () => {
    
  await api
    .post('/api/users')
    .send({
      username: "testuser",
      name: "Test User",
      password: "password123"
    })
    .expect(201)


  const loginResponse = await api
    .post('/api/login')
    .send({
      username: "testuser",
      password: "password123"
    })
    .expect(200)

  const token = loginResponse.body.token


  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: "Test Blog",
      author: "Test Author",
      url: "http://test.com",
      likes: 5
    })
    .expect(201)

  const usersResponse = await api
    .get('/api/users')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const users = usersResponse.body
  assert.strictEqual(users.length, 1)
  assert.strictEqual(users[0].blogs.length, 1)
  assert.strictEqual(users[0].blogs[0].title, "Test Blog")
})

test('blogs are returned with user information', async () => {

await api
    .post('/api/users')
    .send({
      username: "bloguser",
      name: "Blog User",
      password: "password123"
    })
    .expect(201)

  const loginResponse = await api
    .post('/api/login')
    .send({
      username: "bloguser",
      password: "password123"
    })
    .expect(200)

  const token = loginResponse.body.token

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: "Blog with User",
      author: "Blog Author",
      url: "http://blog.com",
      likes: 10
    })
    .expect(201)

  const blogsResponse = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogs = blogsResponse.body
  assert.strictEqual(blogs.length, 1)
  assert.strictEqual(blogs[0].user.username, "bloguser")
  assert.strictEqual(blogs[0].user.name, "Blog User")
})

after(async () => {
  await mongoose.connection.close()
})