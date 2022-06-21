import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router';

import { useSelector, useDispatch } from '../../../hooks';
import { connectToRoom } from '../../../store/slices/connectionSlice';
import { BoardCanvas, BoardUI, ToolsMenu, StylesMenu } from '../../board';

import styles from './RoomPage.module.scss';

const RoomPage = (): React.ReactElement => {
    const dispatch = useDispatch();
    const history = useHistory();
    const { roomId } = useParams<{ roomId: string }>();
    const { isLoading, isConnected, error } = useSelector((s) => s.connection);
    const password = new URLSearchParams(location.search).get('password') || undefined;

    useEffect(() => {
        if (roomId) dispatch(connectToRoom(roomId, password));
    }, [roomId, password]);

    return (
        <div className={styles.roomPage}>
            {isConnected && (
                <>
                    <BoardCanvas />
                    <BoardUI />
                    <ToolsMenu />
                    <StylesMenu />
                </>
            )}
            {isLoading && <h1>Connecting</h1>}
            {error && (
                <>
                    <h1>Error: {error}</h1>
                    <button onClick={() => location.reload()}>Try again</button>
                    <button onClick={() => history.goBack()}>Back to Menu</button>
                </>
            )}
        </div>
    );
};

export default RoomPage;
