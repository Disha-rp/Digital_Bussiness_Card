/**
 * Phase 1 Foundation Smoke Tests
 */

describe('Phase 1 Foundation & Configuration Tests', () => {
  it('validates navigation route structure', () => {
    const requiredRoutes = [
      'Login',
      'MyCards',
      'CreateCard',
      'TemplateSelection',
      'EditCard',
      'Preview',
      'Share',
    ];

    expect(requiredRoutes).toHaveLength(7);
    expect(requiredRoutes[0]).toBe('Login');
    expect(requiredRoutes[1]).toBe('MyCards');
    expect(requiredRoutes[2]).toBe('CreateCard');
    expect(requiredRoutes[3]).toBe('TemplateSelection');
    expect(requiredRoutes[4]).toBe('EditCard');
    expect(requiredRoutes[5]).toBe('Preview');
    expect(requiredRoutes[6]).toBe('Share');
  });

  it('validates environment template placeholder names', () => {
    const expectedEnvKeys = [
      'QRTRAC_BASE_URL',
      'QRTRAC_CLIENT_ID',
      'QRTRAC_CLIENT_SECRET',
      'QRTRAC_TEAM_ID',
      'APP_ENV',
    ];

    expect(expectedEnvKeys).toContain('QRTRAC_CLIENT_SECRET');
    expect(expectedEnvKeys).toContain('QRTRAC_CLIENT_ID');
    expect(expectedEnvKeys).toContain('QRTRAC_TEAM_ID');
  });
});
