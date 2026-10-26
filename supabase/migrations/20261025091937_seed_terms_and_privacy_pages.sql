-- Migration: seed_terms_and_privacy_pages
-- Seeds dynamic editable pages for Terms of Use and Privacy Policy into public.pages.

INSERT INTO public.pages (slug, title, content, status, published_at, meta_description)
VALUES
(
  'terms',
  'Terms of Use',
  '## 1. Organization & Acceptance of Terms
Welcome to the official website of the Saugatuck Douglas Garden Club ("SDGC", "the Club", "we", "our", or "us"). We are a registered 501(c)(3) charitable nonprofit organization dedicated to horticultural education, civic beautification, and environmental stewardship throughout Saugatuck and Douglas, Michigan.

By accessing or using our website (including purchasing Garden Walk tickets, applying for or renewing membership, accessing the member directory, or submitting contact inquiries), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our [Privacy Policy](/privacy). If you do not agree to these terms, please do not use our site.

## 2. Club Membership & Annual Dues
- **Annual, Non-Recurring Dues:** Club membership dues are assessed annually per term year. Membership dues are non-recurring; we do not store recurring credit card subscriptions or automatically charge members.
- **Review & Approval Process:** Membership applications undergo review by our club officers. Payment confirmation and officer approval are distinct operational steps to ensure alignment with our bylaws and volunteer community standards.
- **Member Directory Etiquette:** The online member directory is a private club resource provided exclusively for personal club communications and volunteer coordination. Harvesting, scraping, or utilizing member contact details for commercial solicitation, mass marketing, or unauthorized third-party distribution is strictly prohibited.

## 3. Annual Garden Walk & Event Ticketing
Our signature Annual Garden Walk is a self-guided tour of exquisite private and public coastal gardens. When attending our Garden Walk or ticketed club events:

- **Rain or Shine Policy:** The Garden Walk takes place rain or shine. Because all ticket proceeds directly fund community civic beautification urns, public parks, and local youth horticulture scholarships, ticket sales are non-refundable.
- **Respect for Private Property:** Host gardens are generously opened by private homeowners for this charitable event. Visitors must stay on designated pathways, refrain from picking flowers or taking plant cuttings, keep pets at home (service animals excepted), and respect all property barriers.
- **Accessibility & Terrain:** Due to the historic and natural terrain of private coastal properties, paths may include flagstones, gravel, steps, or uneven lawn surfaces. Attendees tour at their own risk.

## 4. Website Content & Intellectual Property
All text, photographs, garden guides, announcements, logos, and digital assets on this website are the property of the Saugatuck Douglas Garden Club or our contributing members and photographers, protected by United States and international copyright laws.

You may view, print, and download notices and garden event programs for personal, non-commercial use only. Commercial reproduction, redistribution, or modification of any content without prior written consent from the Club is prohibited.

## 5. Horticultural Advice Disclaimer
Informational articles, plant recommendations, pruning schedules, and gardening tips published on this website are shared in good faith by experienced gardeners and Master Gardeners for educational enrichment. Local microclimates, soil conditions, and pest pressures vary; SDGC does not guarantee specific gardening outcomes or assume liability for plant losses or pest management decisions.

## 6. Limitation of Liability
To the maximum extent permitted by Michigan law and federal 501(c)(3) provisions, the Saugatuck Douglas Garden Club, its board members, officers, and volunteers shall not be liable for any indirect, incidental, or consequential damages arising out of your use of this website or attendance at club events.

## 7. Contact Information
If you have questions regarding these Terms of Use, please contact us:

**Saugatuck Douglas Garden Club**  
P.O. Box 1011, Douglas, MI 49406  
Email: info@saugatuckdouglasgardenclub.com  
Inquiry Form: [Online Contact Hub](/contact)',
  'published',
  now(),
  'Terms of Use for the Saugatuck Douglas Garden Club website, annual membership, Garden Walk tour ticketing, and community programs.'
),
(
  'privacy',
  'Privacy Policy',
  '## 1. Our Commitment to Your Privacy
The Saugatuck Douglas Garden Club ("SDGC", "we", "our", or "us") respects your privacy and is dedicated to protecting the personal information of our members, Garden Walk attendees, scholarship applicants, and website visitors.

As a 501(c)(3) charitable organization, we exist to serve our community, not to monetize data. **We do not sell, rent, lease, or trade member, donor, or ticket buyer personal information to any commercial third parties.**

## 2. Information We Collect
Depending on how you interact with our website and club programs, we may collect:

- **Member Account Information:** Name, mailing address, telephone number, email address, optional spouse/partner name, birthday (month and day for club birthday greetings), Master Gardener credentials, and gardening/volunteer interests.
- **Event & Garden Walk Ticketing Data:** Buyer name, email address, quantity of tickets purchased, and transaction identifiers necessary to fulfill tour admissions.
- **Inquiries & Messages:** Name, email address, and message contents submitted through our online contact hub.
- **Technical Usage Data:** Essential session cookies required to maintain secure user authentication, theme preference (light/dark mode), and server-side rate limiting to prevent spam and denial-of-service attempts.

## 3. Member Directory Privacy & Opt-Out Controls
One of our club''s most cherished traditions is fostering fellowship among local gardeners through our Member Directory. We uphold strict privacy boundaries around this directory:

- **Authenticated Access Only:** The directory is accessible exclusively to verified, active club members. It is strictly hidden from search engines (Google, Bing) and the general public.
- **Directory Opt-Out Option:** Any member can elect to hide their listing from the online directory at any time by toggling the "Opt out of Member Directory" switch in their profile settings.
- **Prohibition of Solicitation:** Members agree to use directory listings solely for personal club communications, carpooling to meetings, and committee coordination. Commercial solicitations are strictly prohibited.

## 4. Payment Processing & Financial Security
All online transactions—including annual dues payments and Garden Walk ticket purchases—are processed securely through trusted, PCI-DSS compliant third-party payment gateways (such as Stripe).

**SDGC never sees, collects, or stores full credit card numbers or card verification values (CVV) on our servers.** We receive only confirmation of successful payment, transaction reference numbers, and billing contact details to record membership standing.

## 5. Photography & Community Media
As a vibrant club celebrating gardening artistry, we occasionally photograph public planting workbees, educational meetings, and our Annual Garden Walk for our website gallery and community archive.

We respect personal and homeowner privacy. If a photograph of you or your garden appears on our site that you prefer not to have displayed, please contact us and we will promptly review and remove the image.

## 6. Your Data Rights & Retention
You maintain full control over your personal information:

- **Access & Correction:** You may review and update your profile information at any time by signing in to your [Member Profile](/profile).
- **Account Removal:** Former members may request archival or complete removal of their personal record by notifying club officers.

## 7. Contacting Our Privacy Officers
If you have questions or concerns regarding this Privacy Policy or wish to request data correction or deletion, please reach out to us:

**Saugatuck Douglas Garden Club**  
Attention: Club Officers & Privacy Team  
P.O. Box 1011, Douglas, MI 49406  
Email: privacy@saugatuckdouglasgardenclub.com  
Inquiry Form: [Online Contact Hub](/contact)',
  'published',
  now(),
  'Privacy Policy for the Saugatuck Douglas Garden Club: our commitments to member data protection, directory privacy controls, and secure payment processing.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = excluded.title,
  content = excluded.content,
  meta_description = excluded.meta_description,
  status = excluded.status,
  updated_at = now();
