import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Water Invader',
    short_name: 'WaterInvader',
    description: 'A fast-paced retro 8-bit space shooter!',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.jpg',
        sizes: '192x192 512x512',
        type: 'image/jpeg',
      }
    ],
  }
}
