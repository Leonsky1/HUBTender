import React from 'react';
import { Card, Space, Typography, Row, Col } from 'antd';
import { LogoIcon, HeaderIcon } from './index';

const { Title, Text } = Typography;

/**
 * Icon preview component for testing and documentation
 * Shows both icons at various sizes and colors
 */
export const IconPreview: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>TenderHub Icons Preview</Title>

      <Row gutter={[24, 24]}>
        {/* LogoIcon Preview */}
        <Col xs={24} lg={12}>
          <Card title="LogoIcon - Sidebar Logo">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Size variations */}
              <div>
                <Text strong>Size Variations:</Text>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={16} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>16px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={24} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>24px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={32} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>32px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={48} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>48px</Text>
                  </div>
                </div>
              </div>

              {/* Color variations */}
              <div>
                <Text strong>Color Variations:</Text>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={32} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Light Theme</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={32} color="#10b981" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Dark Theme</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <LogoIcon size={32} color="#1890ff" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Blue</Text>
                  </div>
                </div>
              </div>

              {/* On dark background */}
              <div>
                <Text strong>On Dark Background:</Text>
                <div style={{
                  background: '#141414',
                  padding: '24px',
                  borderRadius: '8px',
                  marginTop: '12px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <LogoIcon size={32} color="#10b981" />
                  <Text style={{ color: '#fff' }}>TenderHub</Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* HeaderIcon Preview */}
        <Col xs={24} lg={12}>
          <Card title="HeaderIcon - Dashboard Header">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Size variations */}
              <div>
                <Text strong>Size Variations:</Text>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={32} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>32px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={48} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>48px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={64} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>64px</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={96} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>96px</Text>
                  </div>
                </div>
              </div>

              {/* On gradient background */}
              <div>
                <Text strong>On Gradient Background (Dashboard Header):</Text>
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  padding: '48px 24px',
                  borderRadius: '12px',
                  marginTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <HeaderIcon size={64} color="#ffffff" />
                  <Title level={3} style={{ color: '#fff', margin: 0 }}>
                    Добро пожаловать в TenderHub
                  </Title>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    Система управления тендерами и строительными расчетами
                  </Text>
                </div>
              </div>

              {/* Color variations */}
              <div>
                <Text strong>Color Variations:</Text>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={48} color="#059669" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Green</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <HeaderIcon size={48} color="#1890ff" />
                    <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Blue</Text>
                  </div>
                  <div style={{ textAlign: 'center', background: '#333', padding: '8px', borderRadius: '4px' }}>
                    <HeaderIcon size={48} color="#ffffff" />
                    <Text style={{ display: 'block', fontSize: '12px', color: '#fff' }}>White</Text>
                  </div>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Usage Examples */}
      <Card title="Usage Examples" style={{ marginTop: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>LogoIcon in Sidebar:</Text>
            <pre style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '8px',
              overflow: 'auto'
            }}>
{`import { LogoIcon } from '@/components/Icons';

<div className="logo">
  <LogoIcon
    size={28}
    color={theme === 'dark' ? '#10b981' : '#059669'}
  />
  <span>TenderHub</span>
</div>`}
            </pre>
          </div>

          <div>
            <Text strong>HeaderIcon in Dashboard:</Text>
            <pre style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '8px',
              overflow: 'auto'
            }}>
{`import { HeaderIcon } from '@/components/Icons';

<div className="header-icon">
  <HeaderIcon size={64} color="#ffffff" />
</div>`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default IconPreview;
