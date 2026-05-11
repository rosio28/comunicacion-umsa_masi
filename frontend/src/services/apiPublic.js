import axios from 'axios'
 
const apiPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})
 
export default apiPublic
 

