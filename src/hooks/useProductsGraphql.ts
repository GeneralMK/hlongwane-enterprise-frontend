import {
  GetProductsDocument,
  GetProductDocument,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useArchiveProductMutation
} from '../generated/graphql'

import type {
  CreateProductInput,
  FindProductsInput,
  UpdateProductInput
} from '../generated/graphql'

export function useProductsGraphql(
  input: FindProductsInput = {}
) {
  const {
    data,
    loading,
    error,
    refetch
  } = useGetProductsQuery({
    variables: { input },
    notifyOnNetworkStatusChange: true
  })

  const result = data?.products

  return {
    products: result?.products ?? [],

    pagination: {
      page: result?.page ?? input.page ?? 1,
      limit: result?.limit ?? input.limit ?? 20,
      total: result?.total ?? 0,
      pages: result?.totalPages ?? 0
    },

    loading,
    error,
    refetch
  }
}

export function useProductGraphql(id?: string) {
  const {
    data,
    loading,
    error,
    refetch
  } = useGetProductQuery({
    variables: { id: id ?? '' },
    skip: !id,
    notifyOnNetworkStatusChange: true
  })

  return {
    product: id ? data?.product ?? null : null,
    loading: Boolean(id) && loading,
    error: id ? error : undefined,
    refetch
  }
}

const productRefetchQueries = [
  GetProductsDocument,
  GetProductDocument
]

export function useProductActionsGraphql() {
  const [executeCreate, creation] =
    useCreateProductMutation({
      refetchQueries: productRefetchQueries,
      awaitRefetchQueries: true
    })

  const [executeUpdate, updating] =
    useUpdateProductMutation({
      refetchQueries: productRefetchQueries,
      awaitRefetchQueries: true
    })

  const [executeArchive, archiving] =
    useArchiveProductMutation({
      refetchQueries: productRefetchQueries,
      awaitRefetchQueries: true
    })

  const createProduct = async (
    input: CreateProductInput
  ) => {
    const result = await executeCreate({
      variables: { input }
    })

    return result.data?.createProduct ?? null
  }

  const updateProduct = async (
    id: string,
    input: UpdateProductInput
  ) => {
    const result = await executeUpdate({
      variables: { id, input }
    })

    return result.data?.updateProduct ?? null
  }

  const archiveProduct = async (id: string) => {
    const result = await executeArchive({
      variables: { id }
    })

    return result.data?.archiveProduct ?? null
  }

  return {
    createProduct,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateProduct,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset,

    archiveProduct,
    archiving: archiving.loading,
    archiveError: archiving.error,
    resetArchive: archiving.reset
  }
}

export default useProductsGraphql