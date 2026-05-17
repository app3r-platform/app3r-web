'use client'

import dynamic from 'next/dynamic'

const ContactInfoEditor = dynamic(
  () => import('@/components/contact/ContactInfoEditor'),
  { ssr: false },
)

export default function ContactInfoPage() {
  return <ContactInfoEditor />
}
