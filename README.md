# Travel Mate

A social travel app built with Expo & React Native.

## Features

- Photo & video posts with dynamic aspect ratio
- Stories with reactions and highlights
- Reels (vertical video feed)
- Threads (text posts)
- Follow system (with follow requests for private accounts)
- Notifications (likes, follows, tags, follow requests)
- Save / bookmark posts
- Hashtags
- Close friends
- Archive
- Post insights
- Carousel posts (multiple images)
- Private accounts

## Tech Stack

- **Frontend:** Expo SDK 56, React Native, expo-router
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Video:** expo-video
- **Images:** expo-image-picker

## Getting Started

```bash
npm install
npx expo start
```

## Build

```bash
eas build --platform ios --profile production
```
