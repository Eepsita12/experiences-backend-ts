export const validateSignup = (body: any) => {
  const { email, password, role } = body

  if (!email || !password || !role) {
    return 'email, password and role are required'
  }

  if (!['user', 'host', 'admin'].includes(role)) {
    return 'invalid role'
  }

  if (password.length < 6) {
    return 'password must be at least 6 characters'
  }

  return null
}
