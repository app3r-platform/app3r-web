'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const TestimonialForm = dynamic(
  () => import('@/components/testimonials/TestimonialForm'),
  { ssr: false },
)

interface Props {
  params: Promise<{ id: string }>
}

export default function EditTestimonialPage({ params }: Props) {
  const { id } = use(params)
  return <TestimonialForm id={id} />
}
