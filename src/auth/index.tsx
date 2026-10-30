import axios from 'axios'

import type { AxiosProgressEvent } from 'axios'

import { API_HOST } from '../utils/contants'
import { fetchJwt } from '../utils'

export interface AuthUser {
  id: string
  authUserId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean

  roles: Array<{
    id: string
    code: string
    name: string
  }>

  permissions: string[]
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface LoginPayload {
  jwt: string
  user: AuthUser
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export type FilePurpose =
  | 'PRODUCT_IMAGE'
  | 'BRAND_LOGO'
  | 'CATEGORY_IMAGE'
  | 'USER_AVATAR'
  | 'RETURN_EVIDENCE'
  | 'WARRANTY_DOCUMENT'
  | 'INVOICE'
  | 'OTHER'

export interface UploadedFile {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: string
  path: string
  bucket: string
  publicUrl: string | null
  purpose: FilePurpose
  status: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface BackendSession {
  token: string
  user: AuthUser
}

interface FileUploadResponse {
  success: boolean
  message?: string
  file: UploadedFile
}

interface ErrorResponse {
  message?: string
  error?:
    | string
    | {
        code?: string
        message?: string
      }
}

const api = axios.create({
  baseURL: `${API_HOST.trim().replace(/\/+$/, '')}/api/v1`,
  timeout: 20_000,
  headers: {
    Accept: 'application/json'
  }
})

export function getAuthError(error: unknown): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const body = error.response?.data

    const nestedMessage = typeof body?.error === 'string' ? body.error : body?.error?.message

    return (
      nestedMessage ||
      body?.message ||
      (error.response?.status === 401
        ? 'Your session is invalid or has expired.'
        : error.message || 'Request failed.')
    )
  }

  return error instanceof Error ? error.message : 'Request failed.'
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()

  if (!email) {
    throw new Error('Email address is required.')
  }

  return email
}

function authorization(token?: string): string {
  const value = (token ?? fetchJwt())?.trim()

  if (!value) {
    throw new Error('Authentication is required.')
  }

  return /^Bearer\s/i.test(value) ? value : `Bearer ${value}`
}

function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data == null) {
    throw new Error(body.message || 'Request failed.')
  }

  return body.data
}

function normalizeSession(session: BackendSession): LoginPayload {
  if (!session.token?.trim() || !session.user || !session.user.isActive) {
    throw new Error('The server returned an invalid session.')
  }

  return {
    jwt: session.token.trim(),
    user: session.user
  }
}

async function login(email: string, password: string): Promise<LoginPayload> {
  if (!password) {
    throw new Error('Password is required.')
  }

  const response = await api.post<ApiResponse<BackendSession>>('/auth/login', {
    email: normalizeEmail(email),
    password
  })

  return normalizeSession(unwrap(response.data))
}

async function register(input: RegisterInput): Promise<LoginPayload> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  if (!firstName || !lastName) {
    throw new Error('First name and last name are required.')
  }

  if (input.password.length < 8 || input.password.length > 128) {
    throw new Error('Password must contain between 8 and 128 characters.')
  }

  const response = await api.post<ApiResponse<BackendSession>>('/auth/register', {
    firstName,
    lastName,
    email: normalizeEmail(input.email),
    password: input.password,

    ...(input.phone?.trim() ? { phone: input.phone.trim() } : {})
  })

  return normalizeSession(unwrap(response.data))
}

async function me(jwt: string, signal?: AbortSignal): Promise<AuthUser> {
  const response = await api.get<ApiResponse<AuthUser>>('/auth/me', {
    signal,
    headers: {
      Authorization: authorization(jwt)
    }
  })

  const user = unwrap(response.data)

  if (!user.isActive) {
    throw new Error('Your account is inactive.')
  }

  return user
}

async function uploadFile(
  file: File,
  purpose: FilePurpose,
  onUploadProgress?: (event: AxiosProgressEvent) => void
): Promise<UploadedFile> {
  const formData = new FormData()

  formData.append('file', file, file.name)
  formData.append('purpose', purpose)

  const response = await api.post<FileUploadResponse>('/files/upload', formData, {
    headers: {
      Authorization: authorization()
    },

    // Browser sets the multipart boundary automatically.
    onUploadProgress,
    timeout: 120_000
  })

  if (!response.data.success || !response.data.file) {
    throw new Error(response.data.message || 'File upload failed.')
  }

  return response.data.file
}

async function uploadImage(
  file: File,
  purpose: FilePurpose,
  onUploadProgress?: (event: AxiosProgressEvent) => void
): Promise<UploadedFile> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.')
  }

  return uploadFile(file, purpose, onUploadProgress)
}

async function upload(
  files: File[],
  purpose: FilePurpose,
  onUploadProgress?: (event: AxiosProgressEvent, files: File[]) => void
): Promise<UploadedFile[]> {
  if (!files.length) {
    throw new Error('At least one file is required.')
  }

  const uploaded: UploadedFile[] = []

  // The backend accepts one file per request.
  // Progress is reported for each file separately.
  for (const file of files) {
    const result = await uploadFile(file, purpose, (event) => onUploadProgress?.(event, [file]))

    uploaded.push(result)
  }

  return uploaded
}

const Auth = {
  login,
  register,
  me,
  upload,
  uploadFile,
  uploadImage
}

export default Auth
