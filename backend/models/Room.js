// models/Room.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: String,

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    propertyType: {
      type: String,
      enum: ["apartment", "house", "villa", "hotel", "resort", "cottage", "hostel"]
    },

    roomType: {
      type: String,
      enum: ["entire_place", "private_room", "shared_room"]
    },

    maxGuests: Number,
    bedrooms: Number,
    beds: Number,
    bathrooms: Number,

    pricePerNight: {
      type: Number,
      required: true
    },

    address: {
      country: String,
      state: String,
      city: String,
      street: String,
      zipCode: String
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        index: "2dsphere"
      }
    },

    amenities: [String],

    images: [
      {
        url: String,
        isPrimary: Boolean
      }
    ],

    availabilityType: {
      type: String,
      enum: ["instant", "approval_required"]
    },

    rating: {
      type: Number,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    },

    reviews: [
      {
        guestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        guestName: String,
        guestAvatar: String,
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for performance
roomSchema.index({ location: "2dsphere" });
roomSchema.index({ pricePerNight: 1 });
roomSchema.index({ "address.city": 1 });
roomSchema.index({ hostId: 1 });

const Room = mongoose.model('Room', roomSchema);
export default Room;