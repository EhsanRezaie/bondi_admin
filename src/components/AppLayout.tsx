import { Layout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  WarningOutlined,
  MessageOutlined,
  NotificationOutlined,
  CommentOutlined,
  FileSearchOutlined,
  ToolOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Sider, Header, Content } = Layout;

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/photos', icon: <PictureOutlined />, label: 'Photo Moderation' },
  { key: '/reports', icon: <WarningOutlined />, label: 'Reports' },
  { key: '/tickets', icon: <MessageOutlined />, label: 'Tickets' },
  { key: '/announcements', icon: <NotificationOutlined />, label: 'Announcements' },
  { key: '/messages', icon: <CommentOutlined />, label: 'Messages' },
  { key: '/logs', icon: <FileSearchOutlined />, label: 'Audit Logs' },
  { key: '/system', icon: <ToolOutlined />, label: 'System' }
];

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, colorBgLayout }
  } = theme.useToken();

  const selectedKey = NAV_ITEMS.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh', background: colorBgLayout }}>
      <Sider collapsible breakpoint="lg">
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 1
          }}
        >
          BONDI Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            paddingInline: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          <Button icon={<LogoutOutlined />} onClick={() => void logout().then(() => navigate('/login'))}>
            Log out
          </Button>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}