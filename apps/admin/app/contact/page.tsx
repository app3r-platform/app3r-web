'use client'

import dynamic from 'next/dynamic'

const ContactInbox = dynamic(
  () => import('@/components/contact/ContactInbox'),
  { ssr: false },
)

export default function ContactInboxPage() {
  return <ContactInbox />
}
