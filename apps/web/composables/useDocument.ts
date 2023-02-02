import type { DocumentType } from "~~/lib/persistence"
export const useDocument = (id: string) => {
  const { $db } = useNuxtApp()
  const { isLoading, data, error } = useQuery<DocumentType>({
    queryKey: [id],
    queryFn: ({ queryKey }) =>
      $db.findUniqueDocument({
        where: { id: queryKey[0] as string },
      }),
    mutationFn: ({ data }) =>
      $db.updateDocument({ data: data, where: { id: data.id } }),
  })
  return {
    isLoading,
    data,
    error,
  }
}
