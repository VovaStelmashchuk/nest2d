import { defineEventHandler, getCookie, setCookie } from 'h3'
import { randomUUID } from 'crypto'
import { TRACKING_COOKIE_NAME } from '../tracking/const'

export default defineEventHandler((event) => {
    const sessionKey = getCookie(event, TRACKING_COOKIE_NAME)

    if (!sessionKey) {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        setCookie(event, TRACKING_COOKIE_NAME, randomUUID(), {
            expires: expires
        })
    }
})

