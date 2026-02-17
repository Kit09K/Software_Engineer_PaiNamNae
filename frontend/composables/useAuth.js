import { useCookie, useNuxtApp, useRouter } from '#app' // ตรวจสอบ import ให้ครบ

export function useAuth() {
  const { $api } = useNuxtApp()
  const router = useRouter()

  const cookieOpts = {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
  
  const token = useCookie('token', cookieOpts)
  const user = useCookie('user', cookieOpts)

  const login = async (identifier, password) => {
    const payload = { password }
    if (identifier.includes('@')) {
      payload.email = identifier
    } else {
      payload.username = identifier
    }

    const res = await $api('/auth/login', {
      method: 'POST',
      body: payload
    })
    token.value = res.token
    user.value = res.user
    return res
  }

  const register = async (formData) => {
    const res = await $api('/users', {
      method: 'POST',
      body: formData 
    })
    return res
  }

  const logout = async () => {
    try {
      await $api('/auth/logout', {
        method: 'POST'
      })
      
    } catch (error) {
      console.error('Logout API Error:', error)
    } finally {
      token.value = null
      user.value = null
      router.push('/')
    }
  }

  return { token, user, login, logout, register }
}

// import { useCookie } from '#app'
// import { useRouter } from 'vue-router'

// export function useAuth() {
//   const { $api } = useNuxtApp()

//   const cookieOpts = {
//     maxAge: 60 * 60 * 24 * 7,
//     path: '/',
//     sameSite: 'lax',
//     secure: process.env.NODE_ENV === 'production'
//   }
//   const token = useCookie('token', cookieOpts)
//   const user = useCookie('user', cookieOpts)
//   // const token = useCookie('token', { maxAge: 60 * 60 * 24 * 7, secure: true })
//   // const user = useCookie('user', { maxAge: 60 * 60 * 24 * 7, secure: true })
//   const router = useRouter()

//   const login = async (identifier, password) => {
//     const payload = { password }
//     if (identifier.includes('@')) {
//       payload.email = identifier
//     } else {
//       payload.username = identifier
//     }

//     const res = await $api('/auth/login', {
//       method: 'POST',
//       body: payload
//     })
//     token.value = res.token
//     user.value = res.user
//     return res
//   }

//   const register = async (formData) => {
//     const res = await $api('/users', {
//       method: 'POST',
//       body: formData 
//     })
//     return res
//   }

//   const logout = () => {
//     token.value = null
//     user.value = null
//     return router.push('/')
//   }

//   return { token, user, login, logout, register }
// }
