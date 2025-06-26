import { collection, addDoc } from "firebase/firestore"
import { db } from "../lib/firebase"

const sampleVideoAds = [
  {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Big Buck Bunny - Sample Ad 1",
  },
  {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Elephants Dream - Sample Ad 2",
  },
  {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "For Bigger Blazes - Sample Ad 3",
  },
]

async function seedVideoAds() {
  try {
    console.log("Adding sample video ads to Firestore...")

    for (const videoAd of sampleVideoAds) {
      const docRef = await addDoc(collection(db, "video_ads"), videoAd)
      console.log(`Added video ad with ID: ${docRef.id}`)
    }

    console.log("Successfully added all video ads!")
  } catch (error) {
    console.error("Error adding video ads:", error)
  }
}

// Run the seeding function
seedVideoAds()
