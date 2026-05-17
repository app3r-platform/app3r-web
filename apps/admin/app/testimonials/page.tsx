'use client'

import dynamic from 'next/dynamic'

const TestimonialList = dynamic(
  () => import('@/components/testimonials/TestimonialList'),
  { ssr: false },
)

export default function TestimonialsPage() {
  return <TestimonialList />
}
