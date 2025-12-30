module.exports = {
    apps: [
        {
            name: 'fellowsip-server',
            script: 'npm',
            args: 'run dev',
            cwd: './packages/server',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        },
        {
            name: 'fellowsip-app',
            script: 'npm',
            args: 'run dev',
            cwd: './packages/app',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'fellowsip-landing',
            script: 'npm',
            args: 'run dev',
            cwd: './packages/landing',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
