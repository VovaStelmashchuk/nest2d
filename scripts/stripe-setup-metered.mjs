// One-off, idempotent setup of the on-demand (usage-based) billing objects in
// Stripe: a Billing Meter, a product and a metered price on that meter. Also
// archives the legacy subscription and credit-pack products.
//
// Usage: STRIPE_SECRET_KEY=sk_... node scripts/stripe-setup-metered.mjs
//
// Run it once per Stripe mode (test and live). Rerunning reuses the existing
// objects. The app's plan sync finds the product by metadata.type=metered.

const STRIPE_BASE = 'https://api.stripe.com/v1'

const METER_EVENT_NAME = 'nesting_run'
const PRODUCT_NAME = 'Nest2D on-demand nesting'
// Price per successful nesting run, in cents: $0.10, so 10 runs cost $1.
const UNIT_AMOUNT_DECIMAL = '10'
const CURRENCY = 'usd'
// Shown by Stripe as "$0.10 per nest" on checkout and invoices.
const UNIT_LABEL = 'nest'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
    console.error('STRIPE_SECRET_KEY is not set')
    process.exit(1)
}

async function stripe(method, path, params) {
    const url = new URL(`${STRIPE_BASE}${path}`)
    const init = {
        method,
        headers: { Authorization: `Bearer ${key}` },
    }
    if (params && method === 'GET') {
        for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v)
    } else if (params) {
        init.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        init.body = new URLSearchParams(params)
    }
    const response = await fetch(url, init)
    const body = await response.json()
    if (!response.ok) {
        throw new Error(`${method} ${path} failed: ${JSON.stringify(body.error)}`)
    }
    return body
}

async function ensureMeter() {
    const meters = await stripe('GET', '/billing/meters', { status: 'active', limit: '100' })
    const existing = meters.data.find((m) => m.event_name === METER_EVENT_NAME)
    if (existing) {
        console.log('Meter exists:', existing.id)
        return existing
    }
    const meter = await stripe('POST', '/billing/meters', {
        display_name: 'Nesting runs',
        event_name: METER_EVENT_NAME,
        'default_aggregation[formula]': 'sum',
        'customer_mapping[type]': 'by_id',
        'customer_mapping[event_payload_key]': 'stripe_customer_id',
        'value_settings[event_payload_key]': 'value',
    })
    console.log('Meter created:', meter.id)
    return meter
}

async function ensureProduct() {
    const products = await stripe('GET', '/products', { active: 'true', limit: '100' })
    const existing = products.data.find((p) => p.metadata?.type === 'metered')
    if (existing) {
        console.log('Product exists:', existing.id)
        if (existing.unit_label !== UNIT_LABEL) {
            await stripe('POST', `/products/${existing.id}`, { unit_label: UNIT_LABEL })
            console.log('Set unit label:', UNIT_LABEL)
        }
        return existing
    }
    const product = await stripe('POST', '/products', {
        name: PRODUCT_NAME,
        description: 'Pay only for successful nesting runs, billed monthly.',
        unit_label: UNIT_LABEL,
        'metadata[type]': 'metered',
    })
    console.log('Product created:', product.id)
    return product
}

async function ensurePrice(product, meter) {
    const prices = await stripe('GET', '/prices', { product: product.id, active: 'true', limit: '100' })
    const existing = prices.data.find(
        (p) =>
            p.recurring?.usage_type === 'metered' &&
            p.recurring?.meter === meter.id &&
            p.unit_amount_decimal === UNIT_AMOUNT_DECIMAL &&
            p.currency === CURRENCY
    )
    if (existing) {
        console.log('Price exists:', existing.id)
        return existing
    }
    const price = await stripe('POST', '/prices', {
        product: product.id,
        currency: CURRENCY,
        unit_amount_decimal: UNIT_AMOUNT_DECIMAL,
        billing_scheme: 'per_unit',
        'recurring[interval]': 'month',
        'recurring[usage_type]': 'metered',
        'recurring[meter]': meter.id,
    })
    console.log('Price created:', price.id)
    return price
}

const meter = await ensureMeter()
const product = await ensureProduct()
const price = await ensurePrice(product, meter)

if (product.default_price !== price.id) {
    await stripe('POST', `/products/${product.id}`, { default_price: price.id })
    console.log('Set default price on product')
}

// Prices are immutable, so a price change creates a new one; archive the rest.
const activePrices = await stripe('GET', '/prices', { product: product.id, active: 'true', limit: '100' })
for (const old of activePrices.data.filter((p) => p.id !== price.id)) {
    await stripe('POST', `/prices/${old.id}`, { active: 'false' })
    console.log('Archived old price:', old.id)
}

// On-demand is the only pay flow: archive the legacy products, i.e. the
// monthly subscription plan (recurring licensed price) and the one-time credit
// packs (metadata.balance).
const allProducts = await stripe('GET', '/products', { active: 'true', limit: '100', 'expand[]': 'data.default_price' })
for (const legacy of allProducts.data) {
    if (legacy.id === product.id) continue
    const isSubscriptionPlan = legacy.default_price?.recurring?.usage_type === 'licensed'
    const isCreditPack = legacy.metadata?.balance != null
    if (!isSubscriptionPlan && !isCreditPack) continue
    await stripe('POST', `/products/${legacy.id}`, { active: 'false' })
    console.log('Archived legacy product:', legacy.id, legacy.name)
}

console.log(JSON.stringify({ meter: meter.id, product: product.id, price: price.id }, null, 2))
