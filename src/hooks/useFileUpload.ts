import { useCallback } from 'react'

import {
  request,
  requireToken
} from '../rest/client'

import type {
  DownloadUrlResult,
  FilePurpose,
  FileResponse,
  JsonValue,
  SignedUploadInput,
  SignedUploadResult
} from '../rest/types'

import {
  useRestMutation,
  useRestQuery
} from './useRest'

export function useFileUpload(token?: string | null) {
  const upload = useCallback(
    async (
      file: File,
      purpose: FilePurpose,
      metadata?: Record<string, JsonValue>
    ) => {
      const body = new FormData()

      body.append('file', file)
      body.append('purpose', purpose)

      if (metadata !== undefined) {
        body.append('metadata', JSON.stringify(metadata))
      }

      const response = await request<FileResponse>(
        '/files/upload',
        {
          method: 'POST',
          token: requireToken(token),
          body
        }
      )

      return response.file
    },
    [token]
  )

  const createSigned = useCallback(
    async (input: SignedUploadInput) => {
      return request<SignedUploadResult>(
        '/files/signed-upload',
        {
          method: 'POST',
          token: requireToken(token),
          body: input
        }
      )
    },
    [token]
  )

  const complete = useCallback(
    async (id: string) => {
      const response = await request<FileResponse>(
        `/files/${encodeURIComponent(id)}/complete`,
        {
          method: 'POST',
          token: requireToken(token)
        }
      )

      return response.file
    },
    [token]
  )

  const download = useCallback(
    async (id: string, expiresIn = 300) => {
      return request<DownloadUrlResult>(
        `/files/${encodeURIComponent(id)}/download-url`,
        {
          method: 'POST',
          token: requireToken(token),
          body: { expiresIn }
        }
      )
    },
    [token]
  )

  const remove = useCallback(
    async (id: string) => {
      const response = await request<FileResponse>(
        `/files/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          token: requireToken(token)
        }
      )

      return response.file
    },
    [token]
  )

  const uploading = useRestMutation(upload)
  const signing = useRestMutation(createSigned)
  const completing = useRestMutation(complete)
  const downloading = useRestMutation(download)
  const deleting = useRestMutation(remove)

  return {
    uploadFile: uploading.execute,
    uploading: uploading.loading,
    uploadError: uploading.error,

    createSignedUpload: signing.execute,
    creatingSignedUpload: signing.loading,
    signedUploadError: signing.error,

    completeUpload: completing.execute,
    completing: completing.loading,
    completeError: completing.error,

    createDownloadUrl: downloading.execute,
    creatingDownloadUrl: downloading.loading,
    downloadError: downloading.error,

    deleteFile: deleting.execute,
    deleting: deleting.loading,
    deleteError: deleting.error
  }
}

export function useFile(
  id?: string,
  token?: string | null
) {
  const query = useRestQuery<FileResponse>(
    id && token
      ? `/files/${encodeURIComponent(id)}`
      : null,
    token
  )

  return {
    file: query.data?.file ?? null,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch
  }
}

export default useFileUpload