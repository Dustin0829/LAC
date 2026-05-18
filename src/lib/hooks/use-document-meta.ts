import { useEffect } from 'react'
import {
  applyDocumentMeta,
  DEFAULT_DOCUMENT_META,
  type DocumentMeta,
} from '@/lib/seo/documentMeta'

/** Set document head tags for the current page; restores defaults on unmount. */
export function useDocumentMeta(meta: DocumentMeta): void {
  useEffect(() => {
    applyDocumentMeta(meta)
    return () => applyDocumentMeta(DEFAULT_DOCUMENT_META)
  }, [meta.title, meta.description, meta.path, meta.ogImage, meta.robots])
}
