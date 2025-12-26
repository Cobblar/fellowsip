import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip';

async function test() {
    console.log('Testing with transform...');

    const client = postgres(connectionString, {
        transform: {
            undefined: undefined,
            value: (x) => {
                if (x instanceof Date) {
                    console.log('Transforming Date:', x);
                    return x.toISOString();
                }
                return x;
            }
        }
    });

    try {
        const now = new Date();
        await client`SELECT ${now}::timestamptz`;
        console.log('SUCCESS: Date object was accepted with transform!');
        process.exit(0);
    } catch (error) {
        console.error('FAILURE: ', error);
        process.exit(1);
    }
}

test();
