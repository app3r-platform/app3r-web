/**
 * tests/unit/components/contact.test.tsx
 * Sub-4 D78 — Contact components: ContactInbox / MessageDetail / ContactInfoEditor / Footer
 * App3R-Admin — Phase D-4 Sub-4
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('@/lib/api/contact', () => ({
  listContactMessages: jest.fn(),
  getContactMessage: jest.fn(),
  updateContactStatus: jest.fn(),
  deleteContactMessage: jest.fn(),
  getAdminContactInfo: jest.fn(),
  updateContactInfo: jest.fn(),
  getPublicContactInfo: jest.fn(),
}))

import ContactInbox from '@/components/contact/ContactInbox'
import MessageDetail from '@/components/contact/MessageDetail'
import ContactInfoEditor from '@/components/contact/ContactInfoEditor'
import Footer from '@/components/Footer'
import {
  listContactMessages,
  getContactMessage,
  updateContactStatus,
  deleteContactMessage,
  getAdminContactInfo,
  updateContactInfo,
  getPublicContactInfo,
} from '@/lib/api/contact'
import type {
  ContactMessageDto,
  ContactInfoDto,
} from '@/lib/types/contact'

const mList = listContactMessages as jest.Mock
const mGet = getContactMessage as jest.Mock
const mUpdStatus = updateContactStatus as jest.Mock
const mDel = deleteContactMessage as jest.Mock
const mGetInfo = getAdminContactInfo as jest.Mock
const mUpdInfo = updateContactInfo as jest.Mock
const mPubInfo = getPublicContactInfo as jest.Mock

const msg: ContactMessageDto = {
  id: 'm1',
  category: 'support',
  name: 'สมชาย ใจดี',
  email: 'somchai@example.com',
  phone: '02-111-2222',
  subject: 'แจ้งปัญหาการเข้าสู่ระบบ',
  body: 'รายละเอียดปัญหา',
  status: 'new',
  createdAt: '2026-05-17T03:00:00Z',
  updatedAt: '2026-05-17T03:00:00Z',
  repliedAt: null,
  repliedBy: null,
  deletedAt: null,
}

const info: ContactInfoDto = {
  companyName: 'App3R จำกัด',
  address: {
    street: 'ถ.สุขุมวิท',
    district: 'วัฒนา',
    province: 'กรุงเทพฯ',
    postalCode: '10110',
    country: 'ไทย',
  },
  phones: [{ label: 'สายด่วน', number: '02-000-0000', hours: 'จ-ศ' }],
  emails: [{ label: 'ทั่วไป', address: 'hi@app3r.com' }],
  socials: [{ platform: 'line', handle: '@app3r', url: 'https://line.me/app3r' }],
  businessHours: { weekdays: 'จ-ศ 9:00-18:00' },
  mapEmbedUrl: null,
  updatedAt: '2026-05-17T00:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.setItem('app3r_admin_token', 'test-token')
})

// ========== ContactInbox ==========
describe('ContactInbox', () => {
  it('renders heading + link to contact info editor', async () => {
    mList.mockResolvedValue([])
    render(<ContactInbox />)
    expect(
      screen.getByText('กล่องข้อความติดต่อ (Inbox)'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('ไม่พบข้อความ')).toBeInTheDocument(),
    )
  })

  it('renders message rows from API', async () => {
    mList.mockResolvedValue([msg])
    render(<ContactInbox />)
    await waitFor(() =>
      expect(
        screen.getByText('แจ้งปัญหาการเข้าสู่ระบบ'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
    // 'รายงานปัญหา' appears in both the filter <option> and the row cell
    expect(screen.getAllByText('รายงานปัญหา').length).toBeGreaterThanOrEqual(1)
  })

  it('shows error state when API rejects', async () => {
    mList.mockRejectedValue(new Error('โหลดล้มเหลว'))
    render(<ContactInbox />)
    await waitFor(() =>
      expect(screen.getByText(/โหลดล้มเหลว/)).toBeInTheDocument(),
    )
  })

  it('refetches when category filter changes', async () => {
    mList.mockResolvedValue([])
    render(<ContactInbox />)
    await waitFor(() => expect(mList).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByLabelText('กรองตามหมวด'), {
      target: { value: 'sales' },
    })
    await waitFor(() =>
      expect(mList).toHaveBeenLastCalledWith(
        'test-token',
        expect.objectContaining({ category: 'sales' }),
      ),
    )
  })

  it('coerces non-array API result to [] (defensive)', async () => {
    mList.mockResolvedValue(null as unknown as ContactMessageDto[])
    render(<ContactInbox />)
    await waitFor(() =>
      expect(screen.getByText('ไม่พบข้อความ')).toBeInTheDocument(),
    )
  })
})

// ========== MessageDetail ==========
describe('MessageDetail', () => {
  it('loads + renders message detail', async () => {
    mGet.mockResolvedValue(msg)
    render(<MessageDetail id="m1" />)
    await waitFor(() =>
      expect(screen.getByText('รายละเอียดข้อความ')).toBeInTheDocument(),
    )
    expect(screen.getByText('somchai@example.com')).toBeInTheDocument()
    expect(screen.getByText('รายละเอียดปัญหา')).toBeInTheDocument()
  })

  it('shows error when load fails', async () => {
    mGet.mockRejectedValue(new Error('ไม่พบ'))
    render(<MessageDetail id="m1" />)
    await waitFor(() =>
      expect(screen.getByText('ไม่พบ')).toBeInTheDocument(),
    )
  })

  it('changes status via updateContactStatus', async () => {
    mGet.mockResolvedValue(msg)
    mUpdStatus.mockResolvedValue({ ...msg, status: 'replied' })
    render(<MessageDetail id="m1" />)
    await waitFor(() =>
      expect(screen.getByText('รายละเอียดข้อความ')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'ตอบแล้ว' }))
    await waitFor(() =>
      expect(mUpdStatus).toHaveBeenCalledWith('test-token', 'm1', {
        status: 'replied',
      }),
    )
  })

  it('soft-deletes after confirm', async () => {
    mGet.mockResolvedValue(msg)
    mDel.mockResolvedValue(undefined)
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MessageDetail id="m1" />)
    await waitFor(() =>
      expect(screen.getByText('รายละเอียดข้อความ')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('ลบข้อความนี้'))
    await waitFor(() =>
      expect(mDel).toHaveBeenCalledWith('test-token', 'm1'),
    )
  })

  it('does not delete when confirm cancelled', async () => {
    mGet.mockResolvedValue(msg)
    jest.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MessageDetail id="m1" />)
    await waitFor(() =>
      expect(screen.getByText('รายละเอียดข้อความ')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('ลบข้อความนี้'))
    expect(mDel).not.toHaveBeenCalled()
  })
})

// ========== ContactInfoEditor ==========
describe('ContactInfoEditor', () => {
  it('loads existing contact-info into form', async () => {
    mGetInfo.mockResolvedValue(info)
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('App3R จำกัด')).toBeInTheDocument(),
    )
    expect(screen.getByDisplayValue('วัฒนา')).toBeInTheDocument()
    expect(screen.getByDisplayValue('02-000-0000')).toBeInTheDocument()
  })

  it('shows notice when load fails (pre-T+2 endpoint not live)', async () => {
    mGetInfo.mockRejectedValue(new Error('404'))
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByText(/แก้ไขบนฟอร์มเปล่าได้/)).toBeInTheDocument(),
    )
  })

  it('validates companyName required before save', async () => {
    mGetInfo.mockResolvedValue({ ...info, companyName: '' })
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByText('บันทึกข้อมูลติดต่อ')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('บันทึกข้อมูลติดต่อ'))
    await waitFor(() =>
      expect(screen.getByText('กรอกชื่อบริษัทก่อนบันทึก')).toBeInTheDocument(),
    )
    expect(mUpdInfo).not.toHaveBeenCalled()
  })

  it('saves via updateContactInfo', async () => {
    mGetInfo.mockResolvedValue(info)
    mUpdInfo.mockResolvedValue(info)
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('App3R จำกัด')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByText('บันทึกข้อมูลติดต่อ'))
    await waitFor(() =>
      expect(mUpdInfo).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ companyName: 'App3R จำกัด' }),
      ),
    )
  })

  it('adds + removes a phone row', async () => {
    mGetInfo.mockResolvedValue({ ...info, phones: [] })
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByText('เบอร์โทรศัพท์')).toBeInTheDocument(),
    )
    // phones[] is empty initially → "+ เพิ่ม" for the phone section is the 1st
    fireEvent.click(screen.getAllByText('+ เพิ่ม')[0])
    await waitFor(() =>
      expect(screen.getByPlaceholderText('02-xxx-xxxx')).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByLabelText('ลบเบอร์โทร'))
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีเบอร์โทร')).toBeInTheDocument(),
    )
  })

  it('edits phone/email/social rows + address + businessHours + mapEmbedUrl', async () => {
    mGetInfo.mockResolvedValue(info)
    mUpdInfo.mockResolvedValue(info)
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByDisplayValue('App3R จำกัด')).toBeInTheDocument(),
    )

    // edit companyName + an address field
    fireEvent.change(screen.getByDisplayValue('App3R จำกัด'), {
      target: { value: 'App3R ใหม่' },
    })
    fireEvent.change(screen.getByDisplayValue('วัฒนา'), {
      target: { value: 'คลองเตย' },
    })

    // edit existing phone label + number + hours
    fireEvent.change(screen.getByDisplayValue('สายด่วน'), {
      target: { value: 'สำนักงานใหญ่' },
    })
    fireEvent.change(screen.getByDisplayValue('02-000-0000'), {
      target: { value: '02-999-9999' },
    })

    // edit existing email
    fireEvent.change(screen.getByDisplayValue('hi@app3r.com'), {
      target: { value: 'support@app3r.com' },
    })

    // change social platform + handle + url
    fireEvent.change(screen.getByDisplayValue('@app3r'), {
      target: { value: '@app3r-official' },
    })
    fireEvent.change(screen.getByLabelText('แพลตฟอร์ม'), {
      target: { value: 'facebook' },
    })

    // edit businessHours weekend + mapEmbedUrl
    const weekendInput = screen
      .getByText('เสาร์-อาทิตย์ (ไม่บังคับ)')
      .closest('div')!
      .querySelector('input') as HTMLInputElement
    fireEvent.change(weekendInput, { target: { value: 'ส-อา 10:00-16:00' } })
    fireEvent.change(
      screen.getByPlaceholderText('https://www.google.com/maps/embed?...'),
      { target: { value: 'https://maps.example/embed' } },
    )

    fireEvent.click(screen.getByText('บันทึกข้อมูลติดต่อ'))
    await waitFor(() =>
      expect(mUpdInfo).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          companyName: 'App3R ใหม่',
          mapEmbedUrl: 'https://maps.example/embed',
        }),
      ),
    )
  })

  it('adds + removes email and social rows', async () => {
    mGetInfo.mockResolvedValue({ ...info, emails: [], socials: [] })
    render(<ContactInfoEditor />)
    await waitFor(() =>
      expect(screen.getByText('อีเมล')).toBeInTheDocument(),
    )
    // sections order: phones[+เพิ่ม], emails[+เพิ่ม], socials[+เพิ่ม]
    const addBtns = screen.getAllByText('+ เพิ่ม')
    fireEvent.click(addBtns[1]) // email
    fireEvent.click(addBtns[2]) // social
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('contact@app3r.com'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByPlaceholderText('@app3r')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('ลบอีเมล'))
    fireEvent.click(screen.getByLabelText('ลบโซเชียล'))
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีอีเมล')).toBeInTheDocument(),
    )
    expect(screen.getByText('ยังไม่มีโซเชียล')).toBeInTheDocument()
  })
})

// ========== Footer ==========
describe('Footer', () => {
  it('renders contact info from public endpoint', async () => {
    mPubInfo.mockResolvedValue(info)
    render(<Footer />)
    await waitFor(() =>
      expect(screen.getByText('App3R จำกัด')).toBeInTheDocument(),
    )
    expect(screen.getByText(/02-000-0000/)).toBeInTheDocument()
    expect(screen.getByText(/hi@app3r.com/)).toBeInTheDocument()
  })

  it('falls back to minimal footer on fetch error', async () => {
    mPubInfo.mockRejectedValue(new Error('down'))
    render(<Footer />)
    await waitFor(() =>
      expect(
        screen.getByText('App3R Admin — ระบบจัดการแพลตฟอร์ม'),
      ).toBeInTheDocument(),
    )
  })
})
