'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const MessageDetail = dynamic(
  () => import('@/components/contact/MessageDetail'),
  { ssr: false },
)

interface Props {
  params: Promise<{ id: string }>
}

export default function ContactMessagePage({ params }: Props) {
  const { id } = use(params)
  return <MessageDetail id={id} />
}
