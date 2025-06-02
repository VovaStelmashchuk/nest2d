import { connectDB } from '~~/server/db/mongo'
import { getBaseUrl, getLemonSqueezyApiKey } from '~~/server/utils/config'
import { generateRandomString } from '~~/server/utils/strings'

const baseUrl = getBaseUrl()
const lemonsqueezyApiKey = getLemonSqueezyApiKey()
const redirectUrl = `${baseUrl}/profile`
const storeId = "112943"

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const variantId = getQuery(event).variantId

    if (!userId) {
        setResponseStatus(401)
        return
    }

    const db = await connectDB()

    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
        setResponseStatus(401)
        return
    }
    
    const transactionSecret = generateRandomString(24)

    const responseData = await $fetch(`https://api.lemonsqueezy.com/v1/checkouts`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${lemonsqueezyApiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            body: {
                data: {
                    type: 'checkouts',
                    attributes: {
                        product_options: {
                            redirect_url: redirectUrl,
                            receipt_button_text: "Go to your account",
                            receipt_thank_you_note: "Thank you for signing up! Click on the button to access your account."
                        },
                        checkout_data: {
                            email: user.email,
                            name: user.name,
                            custom: {
                                userId: user.id,
                                transactionSecret: transactionSecret
                            }
                        },
                    },
                    relationships: {
                        store: {
                            data: {
                                type: "stores",
                                id: storeId
                            }
                        },
                        variant: {
                            data: {
                                type: "variants",
                                id: variantId
                            }
                        }
                    }
                }
            }
        }
    )

    const data = await responseData.data
    const checkoutId = data.id
    const attributes = data.attributes
    const testMode = attributes.test_mode
    const url = attributes.url

    await db.collection('transactions').insertOne({
        transactionSecret: transactionSecret,
        userId: user.id,
        checkoutId: checkoutId,
        status: 'created',
        testMode: testMode,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    return {
        url: url
    }
})
