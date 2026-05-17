'use client'

import dynamic from 'next/dynamic'

const TestimonialForm = dynamic(
  () => import('@/components/testimonials/TestimonialForm'),
  { ssr: false },
)

export default function NewTestimonialPage() {
  return <TestimonialForm />
}
