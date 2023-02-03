import type { DocumentType } from "~~/lib/persistence"
import { findUniqueDocument, updateDocument } from "~~/lib/persistence"
export const useDocument = (id: string) => {
  const { isLoading, data, error } = useQuery<
    Required<DocumentType> | null | undefined
  >({
    queryKey: [id],
    queryFn: ({ queryKey }) =>
      findUniqueDocument({
        where: { documentId: queryKey[0] as string },
      }),
    mutationFn: ({ data }) => {
      if (data) {
        return updateDocument({ data, where: { documentId: data.documentId } })
      }
      return Promise.resolve(null)
    },
  })
  return {
    isLoading,
    data,
    error,
  }
}
