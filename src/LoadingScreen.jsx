// LoadingScreen.jsx
import React, { useEffect, useState } from 'react';
import { Html, useProgress } from '@react-three/drei';

const LoadingScreen = () => {
    const { active, progress, errors, item, loaded, total } = useProgress();
    const [realProgress, setRealProgress] = useState(0);

    useEffect(() => {
        if (progress > realProgress) {
            setRealProgress(progress);
            console.log('Real Progress Updated:', progress);
        }
    }, [progress, realProgress]);

    return (
        <Html center>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '20px 40px',
                borderRadius: '10px',
                color: 'white',
            }}>
                <p style={{ margin: 0, fontSize: '1.5em' }}>Loading...</p>
                <div style={{
                    width: '300px',
                    height: '10px',
                    background: '#555',
                    borderRadius: '5px',
                    marginTop: '20px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${realProgress}%`,
                        height: '100%',
                        background: '#29d',
                        transition: 'width 0.3s ease',
                    }}></div>
                </div>
                <p style={{ marginTop: '10px' }}>{realProgress.toFixed(0)}%</p>
            </div>
        </Html>
    );
};

export default LoadingScreen;
