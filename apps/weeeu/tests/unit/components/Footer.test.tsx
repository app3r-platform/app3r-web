/**
 * tests/unit/components/Footer.test.tsx
 * Sub-CMD-4 D78 — WeeeU Footer
 * Remediation v2: branch phase-d-4/weeeu-sub4-contact base 8be4344
 *
 * ทดสอบ:
 * 1. ContactInfoDto type shape
 * 2. CONTACT_INFO_STUB completeness
 * 3. FooterDisplay rendering
 * 4. Phone links (tel:)
 * 5. Email links (mailto:)
 * 6. Social links
 * 7. Business hours
 * 8. Copyright year
 * 9. fetchContactInfo stub fallback (network error / non-ok response / success)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  FooterDisplay,
  CONTACT_INFO_STUB,
  fetchContactInfo,
} from '@/components/Footer';
import type {
  ContactInfoDto,
  ContactInfoAddress,
  ContactInfoPhone,
  ContactInfoEmail,
  ContactInfoSocial,
  ContactInfoBusinessHours,
  SocialPlatform,
} from '@/lib/types/contact-info';

const makeInfo = (overrides?: Partial<ContactInfoDto>): ContactInfoDto => ({
  ...CONTACT_INFO_STUB,
  ...overrides,
});

// ── 1. Type shape (compile-time checks) ───────────────────────────────────────

describe('ContactInfoDto type shape', () => {
  it('ContactInfoAddress has all required fields', () => {
    const addr: ContactInfoAddress = {
      street: '123 ถนน',
      district: 'เขต',
      province: 'กรุงเทพ',
      postalCode: '10000',
      country: 'Thailand',
    };
    expect(addr.postalCode).toBe('10000');
  });

  it('ContactInfoPhone has optional hours', () => {
    const p: ContactInfoPhone = { label: 'สายด่วน', number: '02-000-0000' };
    expect(p.hours).toBeUndefined();
    const p2: ContactInfoPhone = { label: 'สายด่วน', number: '02-000-0000', hours: 'จ-ศ 9-18' };
    expect(p2.hours).toBe('จ-ศ 9-18');
  });

  it('ContactInfoEmail has label and address', () => {
    const e: ContactInfoEmail = { label: 'ทั่วไป', address: 'info@app3r.co.th' };
    expect(e.address).toBe('info@app3r.co.th');
  });

  it('ContactInfoSocial has platform handle url', () => {
    const s: ContactInfoSocial = {
      platform: 'line' as SocialPlatform,
      handle: '@app3r',
      url: 'https://line.me/ti/p/@app3r',
    };
    expect(s.platform).toBe('line');
  });

  it('ContactInfoBusinessHours has optional weekend and holidays', () => {
    const h: ContactInfoBusinessHours = { weekdays: 'จ-ศ 9:00-18:00' };
    expect(h.weekend).toBeUndefined();
    expect(h.holidays).toBeUndefined();
  });

  it('ContactInfoDto has nullable mapEmbedUrl', () => {
    const dto: ContactInfoDto = makeInfo({ mapEmbedUrl: null });
    expect(dto.mapEmbedUrl).toBeNull();
    const dto2: ContactInfoDto = makeInfo({ mapEmbedUrl: 'https://maps.google.com/embed' });
    expect(dto2.mapEmbedUrl).toBe('https://maps.google.com/embed');
  });
});

// ── 2. CONTACT_INFO_STUB ───────────────────────────────────────────────────────

describe('CONTACT_INFO_STUB', () => {
  it('has companyName', () => { expect(CONTACT_INFO_STUB.companyName).toBeTruthy(); });
  it('has full address', () => {
    expect(CONTACT_INFO_STUB.address.street).toBeTruthy();
    expect(CONTACT_INFO_STUB.address.province).toBeTruthy();
    expect(CONTACT_INFO_STUB.address.postalCode).toBeTruthy();
  });
  it('has at least 1 phone', () => { expect(CONTACT_INFO_STUB.phones.length).toBeGreaterThan(0); });
  it('has at least 1 email', () => { expect(CONTACT_INFO_STUB.emails.length).toBeGreaterThan(0); });
  it('has at least 1 social', () => { expect(CONTACT_INFO_STUB.socials.length).toBeGreaterThan(0); });
  it('has weekdays in businessHours', () => { expect(CONTACT_INFO_STUB.businessHours.weekdays).toBeTruthy(); });
  it('mapEmbedUrl is null in stub', () => { expect(CONTACT_INFO_STUB.mapEmbedUrl).toBeNull(); });
});

// ── 3. FooterDisplay rendering ────────────────────────────────────────────────

describe('FooterDisplay — rendering', () => {
  it('renders footer with data-testid', () => {
    render(<FooterDisplay info={CONTACT_INFO_STUB} />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('shows company name', () => {
    render(<FooterDisplay info={makeInfo({ companyName: 'TestCo' })} />);
    expect(screen.getByText('TestCo')).toBeInTheDocument();
  });

  it('shows address street', () => {
    render(<FooterDisplay info={CONTACT_INFO_STUB} />);
    expect(screen.getByText(CONTACT_INFO_STUB.address.street)).toBeInTheDocument();
  });

  it('shows address province and postalCode', () => {
    render(<FooterDisplay info={CONTACT_INFO_STUB} />);
    const text = `${CONTACT_INFO_STUB.address.district} ${CONTACT_INFO_STUB.address.province} ${CONTACT_INFO_STUB.address.postalCode}`;
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});

// ── 4. Phone links ────────────────────────────────────────────────────────────

describe('FooterDisplay — phones', () => {
  it('renders phone as tel: link (strips dashes)', () => {
    const info = makeInfo({ phones: [{ label: 'สายด่วน', number: '02-123-4567' }] });
    render(<FooterDisplay info={info} />);
    const link = screen.getByText('02-123-4567').closest('a');
    // "02-123-4567" → strip non-digits → "021234567" (9 digits)
    expect(link).toHaveAttribute('href', 'tel:021234567');
  });

  it('shows phone label', () => {
    const info = makeInfo({ phones: [{ label: 'สำนักงาน', number: '02-000-0000' }] });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText(/สำนักงาน/)).toBeInTheDocument();
  });

  it('shows hours when provided', () => {
    const info = makeInfo({
      phones: [{ label: 'สายด่วน', number: '02-000-0000', hours: 'จ-ศ 8:00-17:00 (phone)' }],
      businessHours: { weekdays: 'จ-ศ 9:00-18:00' },
    });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText(/8:00-17:00 \(phone\)/)).toBeInTheDocument();
  });

  it('does not render phone section when phones empty', () => {
    render(<FooterDisplay info={makeInfo({ phones: [] })} />);
    expect(screen.queryByText('โทรศัพท์')).not.toBeInTheDocument();
  });
});

// ── 5. Email links ────────────────────────────────────────────────────────────

describe('FooterDisplay — emails', () => {
  it('renders email as mailto: link', () => {
    const info = makeInfo({ emails: [{ label: 'ทั่วไป', address: 'info@app3r.co.th' }] });
    render(<FooterDisplay info={info} />);
    const link = screen.getByText('info@app3r.co.th').closest('a');
    expect(link).toHaveAttribute('href', 'mailto:info@app3r.co.th');
  });

  it('shows email label', () => {
    const info = makeInfo({ emails: [{ label: 'ฝ่ายขาย', address: 'sales@app3r.co.th' }] });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText(/ฝ่ายขาย/)).toBeInTheDocument();
  });

  it('does not render email section when emails empty', () => {
    render(<FooterDisplay info={makeInfo({ emails: [] })} />);
    expect(screen.queryByText('อีเมล')).not.toBeInTheDocument();
  });
});

// ── 6. Social links ───────────────────────────────────────────────────────────

describe('FooterDisplay — socials', () => {
  it('renders social link with href + target + rel', () => {
    const info = makeInfo({
      socials: [{ platform: 'line' as SocialPlatform, handle: '@app3r', url: 'https://line.me/ti/p/@app3r' }],
    });
    render(<FooterDisplay info={info} />);
    const link = screen.getByRole('link', { name: /line @app3r/i });
    expect(link).toHaveAttribute('href', 'https://line.me/ti/p/@app3r');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows social handle', () => {
    const info = makeInfo({
      socials: [{ platform: 'facebook' as SocialPlatform, handle: 'App3R TH', url: 'https://facebook.com/app3r' }],
    });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText('App3R TH')).toBeInTheDocument();
  });

  it('does not render social section when socials empty', () => {
    render(<FooterDisplay info={makeInfo({ socials: [] })} />);
    expect(screen.queryByText('โซเชียลมีเดีย')).not.toBeInTheDocument();
  });
});

// ── 7. Business hours ─────────────────────────────────────────────────────────

describe('FooterDisplay — business hours', () => {
  it('shows weekdays hours', () => {
    const info = makeInfo({ businessHours: { weekdays: 'จ-ศ 9:00-18:00' } });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText('จ-ศ 9:00-18:00')).toBeInTheDocument();
  });

  it('shows weekend when provided', () => {
    const info = makeInfo({ businessHours: { weekdays: 'จ-ศ 9:00-18:00', weekend: 'ส-อา 10:00-17:00' } });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText('ส-อา 10:00-17:00')).toBeInTheDocument();
  });

  it('shows holidays when provided', () => {
    const info = makeInfo({ businessHours: { weekdays: 'จ-ศ 9:00-18:00', holidays: 'ปิดวันหยุดนักขัตฤกษ์' } });
    render(<FooterDisplay info={info} />);
    expect(screen.getByText('ปิดวันหยุดนักขัตฤกษ์')).toBeInTheDocument();
  });

  it('does not show weekend when not provided', () => {
    const info = makeInfo({ businessHours: { weekdays: 'จ-ศ 9:00-18:00' } });
    render(<FooterDisplay info={info} />);
    expect(screen.queryByText(/ส-อา/)).not.toBeInTheDocument();
  });
});

// ── 8. Copyright year ─────────────────────────────────────────────────────────

describe('FooterDisplay — copyright', () => {
  it('shows current year', () => {
    const year = new Date().getFullYear().toString();
    render(<FooterDisplay info={CONTACT_INFO_STUB} />);
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});

// ── 9. fetchContactInfo stub fallback ─────────────────────────────────────────

describe('fetchContactInfo — stub fallback', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  it('returns STUB when fetch throws (network error)', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network Error'));
    const result = await fetchContactInfo();
    expect(result).toEqual(CONTACT_INFO_STUB);
  });

  it('returns STUB when response is not ok (500)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    const result = await fetchContactInfo();
    expect(result).toEqual(CONTACT_INFO_STUB);
  });

  it('returns STUB when response is not ok (404)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const result = await fetchContactInfo();
    expect(result).toEqual(CONTACT_INFO_STUB);
  });

  it('returns parsed data when fetch succeeds', async () => {
    const mockData: ContactInfoDto = makeInfo({ companyName: 'Real Company' });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);
    const result = await fetchContactInfo();
    expect(result.companyName).toBe('Real Company');
  });
});
