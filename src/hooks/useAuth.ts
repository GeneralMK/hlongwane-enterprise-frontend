import { useCallback } from 'react'

import { request } from '../rest/client'

import type {
  ApiResponse,
  AuthUser,
  RegisteredCustomer,
  RegisterCustomerInput
} from '../rest/types'

import { useRestMutation, useRestQuery } from './useRest'

export function useAuth(token?: string | null) {
  const profile = useRestQuery<ApiResponse<AuthUser>>(token ? '/auth/me' : null, token)

  const register = useCallback(async (input: RegisterCustomerInput) => {
    const response = await request<ApiResponse<RegisteredCustomer>>('/auth/register', {
      method: 'POST',
      body: input
    })

    return response.data
  }, [])

  const registration = useRestMutation(register)

  return {
    user: profile.data?.data ?? null,
    loading: profile.loading,
    error: profile.error,
    refetchMe: profile.refetch,

    registerCustomer: registration.execute,
    registering: registration.loading,
    registrationError: registration.error,
    resetRegistration: registration.reset
  }
}

export default useAuth
