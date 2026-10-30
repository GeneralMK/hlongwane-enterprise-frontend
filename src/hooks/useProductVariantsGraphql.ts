import {
  GetProductVariantsDocument,
  GetProductVariantDocument,
  useGetProductVariantsQuery,
  useGetProductVariantQuery,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation
} from '../generated/graphql'

import type {
  CreateProductVariantInput,
  UpdateProductVariantInput
} from '../generated/graphql'

export function useProductVariantsGraphql(
  productId?: string
) {
  const {
    data,
    loading,
    error,
    refetch
  } = useGetProductVariantsQuery({
    variables: {
      productId: productId ?? ''
    },
    skip: !productId,
    notifyOnNetworkStatusChange: true
  })

  return {
    variants: productId
      ? data?.productVariants ?? []
      : [],
    loading: Boolean(productId) && loading,
    error: productId ? error : undefined,
    refetch
  }
}

export function useProductVariantGraphql(id?: string) {
  const {
    data,
    loading,
    error,
    refetch
  } = useGetProductVariantQuery({
    variables: {
      id: id ?? ''
    },
    skip: !id,
    notifyOnNetworkStatusChange: true
  })

  return {
    variant: id ? data?.productVariant ?? null : null,
    loading: Boolean(id) && loading,
    error: id ? error : undefined,
    refetch
  }
}

const variantRefetchQueries = [
  GetProductVariantsDocument,
  GetProductVariantDocument
]

export function useProductVariantActionsGraphql() {
  const [executeCreate, creation] =
    useCreateProductVariantMutation({
      refetchQueries: variantRefetchQueries,
      awaitRefetchQueries: true
    })

  const [executeUpdate, updating] =
    useUpdateProductVariantMutation({
      refetchQueries: variantRefetchQueries,
      awaitRefetchQueries: true
    })

  const createVariant = async (
    input: CreateProductVariantInput
  ) => {
    const result = await executeCreate({
      variables: { input }
    })

    return result.data?.createProductVariant ?? null
  }

  const updateVariant = async (
    id: string,
    input: UpdateProductVariantInput
  ) => {
    const result = await executeUpdate({
      variables: { id, input }
    })

    return result.data?.updateProductVariant ?? null
  }

  return {
    createVariant,
    creating: creation.loading,
    createError: creation.error,
    resetCreate: creation.reset,

    updateVariant,
    updating: updating.loading,
    updateError: updating.error,
    resetUpdate: updating.reset
  }
}

export default useProductVariantsGraphql