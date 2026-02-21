import mongoose from 'mongoose';


export const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not defined');
    }

    const fallbackUri = process.env.MONGO_FALLBACK_URI || 'mongodb://127.0.0.1:27017/stayhub24';

    const connectWithUri = async (uri) => {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });
    };

    try {
        await connectWithUri(process.env.MONGO_URI);
        console.log('MongoDB Atlas connected successfully.');
    } catch (error) {
        console.error(' MongoDB connection failed:', error.message);

        const authFailure = error?.message?.toLowerCase().includes('auth');
        const networkFailure =
            error?.message?.includes('whitelist') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.message?.includes('Could not connect to any servers');

        if ((authFailure || networkFailure) && fallbackUri && fallbackUri !== process.env.MONGO_URI) {
            console.warn(' Falling back to local MongoDB at mongodb://127.0.0.1:27017/stayhub24');

            try {
                await connectWithUri(fallbackUri);
                console.log('Local MongoDB connected successfully.');
                return;
            } catch (fallbackError) {
                console.error(' Local MongoDB connection failed:', fallbackError.message);
            }
        }

        if (authFailure) {
            console.error('Atlas rejected the credentials in MONGO_URI. Verify the username, password, and database access in Atlas or set MONGO_FALLBACK_URI for local development.');
        } else if (networkFailure) {
            console.error(
                'Atlas is rejecting this machine. Add your current IP to MongoDB Atlas Network Access or use a reachable local MongoDB URI.'
            );
        }

        throw error;
    }
};
