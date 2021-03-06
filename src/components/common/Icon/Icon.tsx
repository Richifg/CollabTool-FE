import React from 'react';
import { IconName } from '../../../interfaces';

import styles from './Icon.module.scss';

interface Icon {
    className?: string;
    name: IconName;
}

const Icon: React.FC<Icon> = ({ name, className = '' }): React.ReactElement => {
    return <i className={` ${styles.icon} ${styles[`icon-${name}`]} ${className}`} />;
};

export default Icon;
