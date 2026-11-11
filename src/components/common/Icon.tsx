import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'groups'
  | 'users'
  | 'activity'
  | 'balances'
  | 'profile'
  | 'plus'
  | 'minus'
  | 'search'
  | 'filter'
  | 'bell'
  | 'settings'
  | 'check'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-up-right'
  | 'arrow-down-left'
  | 'edit'
  | 'trash'
  | 'receipt'
  | 'wallet'
  | 'share'
  | 'pie-chart'
  | 'calendar'
  | 'info'
  | 'alert'
  | 'refresh'
  | 'logout'
  | 'food'
  | 'travel'
  | 'home-cat'
  | 'shopping'
  | 'entertainment'
  | 'utilities'
  | 'medical'
  | 'money'
  | 'user-plus'
  | 'crown'
  | 'sparkles'
  | 'camera'
  | 'location'
  | 'image'
  | 'phone'
  | 'lock'
  | 'backspace'
  | 'fingerprint'
  | 'shield';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#176B50' }) => {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'groups':
    case 'users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'activity':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 12H18L15 21L9 3L6 12H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'balances':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2V22M17 5H9.5C8.11929 5 7 6.11929 7 7.5C7 8.88071 8.11929 10 9.5 10H14.5C15.8807 10 17 11.1193 17 12.5C17 13.8807 15.8807 15 14.5 15H7M5 19H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'minus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19.4 15A1.65 1.65 0 0 0 20 16.5V17.5A1.65 1.65 0 0 1 18.35 19H17.5A1.65 1.65 0 0 0 16 19.4A1.65 1.65 0 0 0 15 21V21.5A1.65 1.65 0 0 1 13.5 23H10.5A1.65 1.65 0 0 1 9 21.5V21A1.65 1.65 0 0 0 8 19.4A1.65 1.65 0 0 0 6.5 19H5.65A1.65 1.65 0 0 1 4 17.5V16.5A1.65 1.65 0 0 0 3.4 15A1.65 1.65 0 0 0 2 14V10A1.65 1.65 0 0 1 3.4 8.5A1.65 1.65 0 0 0 4 7V6.5A1.65 1.65 0 0 1 5.65 5H6.5A1.65 1.65 0 0 0 8 4.6A1.65 1.65 0 0 0 9 3V2.5A1.65 1.65 0 0 1 10.5 1H13.5A1.65 1.65 0 0 1 15 2.5V3A1.65 1.65 0 0 0 16 4.6A1.65 1.65 0 0 0 17.5 5H18.35A1.65 1.65 0 0 1 20 6.5V7A1.65 1.65 0 0 0 20.6 8.5A1.65 1.65 0 0 0 22 10V14A1.65 1.65 0 0 1 20.6 15.5A1.65 1.65 0 0 0 19.4 15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow-up-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 17L17 7M17 7H7M17 7V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'arrow-down-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17 7L7 17M7 17H17M7 17V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56263 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 6H5H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M10 11V17M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'receipt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 2V22L7 20L10 22L13 20L16 22L19 20L21 22V2L19 4L16 2L13 4L10 2L7 4L4 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8 8H16M8 12H16M8 16H12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 7V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3H4C3.46957 3 2.96086 3.21071 2.58579 3.58579C2.21071 3.96086 2 4.46957 2 5V19C2 19.5304 2.21071 20.0391 2.58579 20.4142C2.96086 20.7893 3.46957 21 4 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 12H22V17H16C15.4696 17 14.9609 16.7893 14.5858 16.4142C14.2107 16.0391 14 15.5304 14 15C14 14.4696 14.2107 13.9609 14.5858 13.5858C14.9609 13.2107 15.4696 13 16 12Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="18" cy="14.5" r="1" fill={color} />
        </Svg>
      );
    case 'pie-chart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21.21 15.89C20.3542 17.8286 18.9198 19.4633 17.0945 20.5794C15.2692 21.6955 13.1415 22.238 10.99 22.135C8.8385 22.0321 6.76449 21.2885 5.03988 20.0016C3.31527 18.7147 2.02237 16.9458 1.33 14.92C0.637626 12.8942 0.57864 10.7061 1.16075 8.64167C1.74286 6.57724 2.93988 4.73377 4.59596 3.35123C6.25204 1.96869 8.28989 1.11181 10.44 0.89C12.5901 0.66819 14.7479 1.09176 16.63 2.11L12 12L21.21 15.89Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M22 12A10 10 0 0 0 12 2V12H22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'food':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8H19C20.1046 8 21 8.89543 21 10V11C21 12.1046 20.1046 13 19 13H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 8H18V14C18 16.2091 16.2091 18 14 18H9C6.79086 18 5 16.2091 5 14V8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 21H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'travel':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17.8 19.2L16 11L19.5 7.5C20.3 6.7 20.3 5.3 19.5 4.5C18.7 3.7 17.3 3.7 16.5 4.5L13 8L4.8 6.2C4.3 6.1 3.8 6.3 3.5 6.7C3.1 7.1 3.1 7.7 3.4 8.1L7.5 13L5.5 15L3.5 14.5L2 16L5 18L7 21L8.5 19.5L8 17.5L10 15.5L14.9 19.6C15.3 19.9 15.9 19.9 16.3 19.5C16.7 19.2 16.9 18.7 17.8 19.2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'home-cat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 22V12H15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'utilities':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'shopping':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H20C20.5304 22 21.0391 21.7893 21.4142 21.4142C21.7893 21.0391 22 20.5304 22 20V6L19 2H6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 6H21M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'entertainment':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
          <Circle cx="6" cy="12" r="1.5" fill={color} />
          <Circle cx="18" cy="12" r="1.5" fill={color} />
          <Path d="M10 10L14 12L10 14V10Z" fill={color} />
        </Svg>
      );
    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 17L21 12L16 7M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
          <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'user-plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 8V14M23 11H17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M2 19H22M2 5L6 15L12 9L18 15L22 5L20 19H4L2 5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'sparkles':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L14.4 7.2L21.6 9.6L14.4 12L12 19.2L9.6 12L2.4 9.6L9.6 7.2L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'location':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'image':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" />
          <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
          <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'backspace':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 9l-6 6M12 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'fingerprint':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2 12a10 10 0 0 1 18-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M21.8 16c.2-2 .131-5.354 0-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M8.65 22c.21-.66.45-1.32.57-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
          <Path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
  }
};
