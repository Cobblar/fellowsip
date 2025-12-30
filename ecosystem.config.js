module.exports = {
    apps: [
        {
            name: 'fellowsip-server',
            script: 'npm',
            args: 'run dev:server',
            cwd: './',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        },
        {
            name: 'fellowsip-app',
            script: 'npm',
            args: 'run dev:app',
            cwd: './',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'fellowsip-landing',
            script: 'npm',
            args: 'run dev:landing',
            cwd: './',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
