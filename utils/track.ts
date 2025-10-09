import type { TrackRequest } from '~~/shared/types/track_body'

export async function trackEvent(
    action: string,
    data: Record<string, string> = {},
): Promise<void> {
    try {
        const trackRequest: TrackRequest = {
            action,
            data,
        }

        await $fetch('/api/track', {
            method: 'POST',
            body: trackRequest
        })
    } catch (error) {
        console.warn('Failed to track event:', error)
    }
}