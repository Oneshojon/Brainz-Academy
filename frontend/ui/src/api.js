import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/catalog/',
  withCredentials: true, // sends session cookie for auth
})

export default api