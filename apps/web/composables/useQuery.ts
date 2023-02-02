import { throttle } from "~~/utils"

type QueryContext = {
  queryKey: unknown[]
  meta: Record<string, unknown> | undefined
}
type MutationContext<T> = {
  data: T
  meta: Record<string, unknown> | undefined
}
type QueryOptions<T> = {
  queryKey: unknown[]
  queryFn: (context: QueryContext) => Promise<T>
  mutationFn: (context: MutationContext<T>) => Promise<T>
  meta?: Record<string, unknown> | undefined
}

export const useQuery = <T>({
  queryKey,
  queryFn,
  mutationFn,
  meta,
}: QueryOptions<T>) => {
  const data = ref<T>()
  const error = ref<any>()
  const isLoading = ref(true)
  const context = { queryKey, meta }
  queryFn(context)
    .then((d) => {
      data.value = d
    })
    .catch((e: any) => {
      console.error(e)
    })
    .finally(() => {
      isLoading.value = false
    })

  watch(
    data,
    throttle((newVal) => {
      const context = { data: newVal, meta }
      mutationFn(context)
    }, 3000),
    {
      deep: true,
    }
  )
  return {
    data,
    error,
    isLoading,
  }
}
