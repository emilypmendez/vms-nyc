import {
    authenticate,
    getBearerToken,
    allowMethods,
    sendError
  } from '../../../lib/supabase';
  
  import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
  
  export default async function handler(req, res) {
    if (!allowMethods(req, res, ['POST'])) return;
  
    res.setHeader('Cache-Control', 'private, no-store');
  
    try {
      const auth = await authenticate(req);
  
      if (auth.error) {
        return sendError(res, auth.statusCode, auth.error);
      }
  
      const token = getBearerToken(req);
      const admin = getSupabaseAdmin();
  
      const { error } = await admin.auth.admin.signOut(
        token,
        'local'
      );
  
      if (error) {
        console.error('Logout error:', error);
        return sendError(res, 500, 'Failed to revoke session');
      }
  
      return res.status(200).json({
        success: true,
        message: 'Signed out successfully'
      });
  
    } catch (error) {
      console.error('Logout error:', error);
      return sendError(res, 500, 'Internal server error');
    }
  }
  