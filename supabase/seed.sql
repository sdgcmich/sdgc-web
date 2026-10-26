-- Synthetic deterministic seed data for local SDGC development and testing.
-- No real club members or live credentials are used.

-- Site settings
insert into public.site_settings (key, value, description) values
  ('club_info', '{"name": "Saugatuck Douglas Garden Club", "email": "info@saugatuckdouglasgardenclub.com", "phone": "269-857-4148", "address": "P.O. Box 1011, Douglas, MI 49406"}'::jsonb, 'General club contact details'),
  ('membership_config', '{"dues_cents": 5000, "current_year": 2026, "currency": "USD"}'::jsonb, 'Active annual dues configuration')
on conflict (key) do update set value = excluded.value;

-- Membership terms (2025 past, 2026 current, 2027 future)
insert into public.membership_terms (year, dues_cents, currency, opens_at, closes_at) values
  (2025, 5000, 'USD', '2025-01-01 00:00:00-05', '2025-12-31 23:59:59-05'),
  (2026, 5000, 'USD', '2026-01-01 00:00:00-05', '2026-12-31 23:59:59-05'),
  (2027, 5000, 'USD', '2027-01-01 00:00:00-05', '2027-12-31 23:59:59-05')
on conflict (year) do update set dues_cents = excluded.dues_cents;

-- Venues
insert into public.venues (id, name, address, city, state, postal_code, url) values
  ('d1111111-1111-1111-1111-111111111111', 'Saugatuck Woman''s Club', '303 Butler St', 'Saugatuck', 'MI', '49453', 'https://saugatuck.com/'),
  ('d2222222-2222-2222-2222-222222222222', 'Old School House Douglas', '130 Center St', 'Douglas', 'MI', '49406', 'https://sdhistoricalsociety.org/'),
  ('d3333333-3333-3333-3333-333333333333', 'Wick''s Park Gazebo', '449 Water St', 'Saugatuck', 'MI', '49453', null),
  ('d4444444-4444-4444-4444-444444444444', 'Fenn Valley Vineyards', '6130 122nd Ave', 'Fennville', 'MI', '49408', 'https://www.fennvalley.com/'),
  ('d5555555-5555-5555-5555-555555555555', 'Saugatuck Middle School', '401 Elizabeth St', 'Saugatuck', 'MI', '49453', null),
  ('d6666666-6666-6666-6666-666666666666', 'Huntree Nursery', '2315 Blue Star Hwy', 'Fennville', 'MI', '49408', 'https://huntree.com/')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  postal_code = excluded.postal_code,
  url = excluded.url;

-- Events
insert into public.events (id, slug, title, category, excerpt, description, starts_at, ends_at, timezone, all_day, venue_id, status, ticket_url, featured_image) values
  (
    'e5555555-5555-5555-5555-555555555555',
    'monthly-board-meeting-nov-2026',
    'Monthly Board Meeting',
    'Executive Committee',
    'Monthly board of directors meeting discussing upcoming club activities, budget reviews, and civic plantings.',
    'The SDGC Board meets on the second Monday of each month. Members are welcome to observe and learn about upcoming projects, civic beautification plans, and committee updates.',
    '2026-11-09 09:30:00-05',
    '2026-11-09 11:30:00-05',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    null,
    '/images/brand/sdgc-logo.jpg'
  ),
  (
    'e6666666-6666-6666-6666-666666666666',
    'holiday-swag-and-senior-workshop-2026',
    'Holiday Swag & Senior Floral Arrangement Workshop',
    'Workshops & Presentations',
    'Volunteers and local 6th graders create fresh evergreen centerpieces for residents at Grace of Douglas and Golden Orchards.',
    'Each December, SDGC volunteers collaborate with local students to design festive evergreen arrangements and decorative door swags. These handmade floral gifts are delivered directly to area nursing facilities and senior centers across Allegan County to bring warmth and holiday cheer.',
    '2026-12-05 10:00:00-05',
    '2026-12-05 13:00:00-05',
    'America/Detroit',
    false,
    'd5555555-5555-5555-5555-555555555555',
    'published',
    null,
    '/images/wordpress/kids-activity-1600x1600-circle.png'
  ),
  (
    'e7777777-7777-7777-7777-777777777777',
    'annual-club-holiday-dinner-2026',
    'Annual Club Holiday Dinner & Social Celebration',
    'Social Gatherings',
    'Celebrate the close of a wonderful gardening season with good food, friendship, and local wine.',
    'Join fellow Garden Club members, spouses, and guests for our annual celebratory year-end gathering. Enjoy seasonal appetizers, catered dinner, and dessert alongside Fenn Valley wines. Annual recognition awards and holiday toasts will be presented by our Club President.',
    '2026-12-10 18:00:00-05',
    '2026-12-10 21:00:00-05',
    'America/Detroit',
    false,
    'd4444444-4444-4444-4444-444444444444',
    'published',
    null,
    '/images/wordpress/2O8A5979-scaled-e1746814119349.jpeg'
  ),
  (
    'e8888888-8888-8888-8888-888888888888',
    'welcome-back-tea-2027',
    'Welcome Back Tea & Annual Season Kickoff',
    'Social Gatherings',
    'Our annual Tea is the festive opening of our Garden Club season. Renew friendships and sign up for volunteer activities.',
    'The annual Welcome Back Tea marks the official opening of the Garden Club season! Renew friendships, meet our newest members, preview the year''s educational calendar, and volunteer for upcoming civic planting days and the Garden Walk committee. Delectable refreshments, herbal teas, and baked treats provided.',
    '2027-04-19 14:00:00-04',
    '2027-04-19 16:00:00-04',
    'America/Detroit',
    false,
    'd1111111-1111-1111-1111-111111111111',
    'published',
    null,
    '/images/wordpress/2O8A6596-1000x1000-1.jpg'
  ),
  (
    'e9999999-9999-9999-9999-202607110000',
    '2026-garden-walk-fundraiser',
    '2026 Garden Walk Fundraiser & Perennial Plant Sale',
    'Annual Fundraiser',
    'Tour 6 spectacular private coastal gardens. Features the member perennial plant sale and garden treasures at the Old School House.',
    'Self-guided tour of six stunning private gardens and public plantings in Saugatuck and Douglas. Proceeds support community beautification and horticultural scholarships.',
    '2026-07-11 10:00:00-04',
    '2026-07-11 16:00:00-04',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    'https://saugatuckdouglasgardenclub.com/garden-walk',
    '/images/wordpress/DSC_2808-scaled-1.jpg'
  ),
  (
    'e9999999-9999-9999-9999-999999999999',
    '47th-annual-garden-walk-fundraiser',
    '47th Annual Garden Walk Fundraiser & Perennial Plant Sale',
    'Annual Fundraiser',
    'Tour 6 spectacular private coastal gardens. Features the member perennial plant sale and garden treasures at the Old School House.',
    'Our signature annual event and premier community fundraiser! Tour six extraordinary private residential gardens across Saugatuck and Douglas, starting from the historic Old School House (130 W Center St). Enjoy the member-divided perennial plant sale ($5 each or 6 for $25) and "hidden garden treasures" sale. 100% of proceeds fund college scholarships for local high school seniors and civic streetscape planters.',
    '2027-07-17 10:00:00-04',
    '2027-07-17 16:00:00-04',
    'America/Detroit',
    false,
    'd2222222-2222-2222-2222-222222222222',
    'published',
    'https://saugatuckdouglasgardenclub.com/garden-walk',
    '/images/wordpress/DSC_2808-scaled-1.jpg'
  )
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  category = excluded.category,
  excerpt = excluded.excerpt,
  description = excluded.description,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  timezone = excluded.timezone,
  venue_id = excluded.venue_id,
  status = excluded.status,
  ticket_url = excluded.ticket_url,
  featured_image = excluded.featured_image;

-- Pages
insert into public.pages (slug, title, content, status, published_at, meta_description) values
  (
    'aboutourclub',
    'About Saugatuck Douglas Garden Club',
    'Organized in 1978, the Saugatuck Douglas Garden Club works continuously to beautify and enhance the communities of Saugatuck and Douglas through floral landscaping, educational workshops, environmental conservation, and civic partnership.',
    'published',
    '2026-01-01 00:00:00-05',
    'Learn about our history, community projects, monthly meetings, and civic leadership.'
  ),
  (
    'garden-walk',
    'Annual Garden Walk',
    'The Garden Walk is the club''s premier annual fundraising event. For over four decades, local gardeners open their private landscapes to the public, sharing ideas and inspiration.',
    'published',
    '2026-01-01 00:00:00-05',
    'Details, tour schedules, and ticket links for the Saugatuck Douglas Annual Garden Walk.'
  )
on conflict (slug) do nothing;

-- Media Assets & Albums
insert into public.media_assets (id, storage_path, mime_type, size_bytes, width, height, alt_text, caption, is_public) values
  ('c1111111-1111-1111-1111-111111111111', 'public/sdgc-logo.jpg', 'image/jpeg', 48200, 800, 800, 'Saugatuck Douglas Garden Club official logo', 'Official club insignia since 1978', true),
  ('c2222222-2222-2222-2222-222222222222', 'public/garden-walk-2025-1.jpg', 'image/jpeg', 125000, 1200, 800, 'Cottage garden with perennial border in Douglas', 'Perennial border in historic Douglas cottage', true),
  ('c3333333-3333-3333-3333-333333333333', 'public/civic-beautification-1.jpg', 'image/jpeg', 98000, 1200, 800, 'Volunteers planting downtown civic containers', 'Civic beautification team on Butler Street', true),
  ('c4444444-4444-4444-4444-444444444444', 'private/board-minutes-2026.pdf', 'application/pdf', 245000, null, null, 'Private Board Minutes 2026', 'Restricted to board members', false)
on conflict (id) do nothing;

insert into public.albums (id, slug, title, description, year, is_public) values
  ('a1111111-1111-1111-1111-111111111111', 'garden-walk-highlights', 'Garden Walk Highlights', 'Select photos from recent Saugatuck Douglas Garden Walks.', 2025, true),
  ('a2222222-2222-2222-2222-222222222222', 'civic-beautification', 'Civic Beautification Projects', 'Community planting and municipal flower installations.', 2025, true)
on conflict (id) do nothing;

insert into public.album_items (album_id, media_asset_id, sort_order) values
  ('a1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 1),
  ('a2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 1)
on conflict (album_id, media_asset_id) do nothing;

-- Legacy URL mappings from P0 discovery
insert into public.legacy_mappings (legacy_id, legacy_url, target_url, entity_type) values
  ('wp-home', '/', '/', 'page'),
  ('wp-about', '/aboutourclub/', '/aboutourclub', 'page'),
  ('wp-garden-walk', '/garden-walk/', '/garden-walk', 'page'),
  ('wp-gallery', '/gallery/', '/gallery', 'page'),
  ('wp-events', '/events/', '/events', 'events'),
  ('wp-contact', '/contact/', '/contact', 'contact'),
  ('wp-membership', '/membership/', '/membership', 'page'),
  ('wp-becomeamember', '/becomeamember/', '/becomeamember', 'auth'),
  ('wp-login', '/login/', '/login', 'auth'),
  ('wp-profile', '/profile/', '/profile', 'member'),
  ('wp-admin', '/admin/', '/admin', 'admin')
on conflict (legacy_url) do nothing;
