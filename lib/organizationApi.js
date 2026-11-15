// Server-side helpers shared by the organization API routes.
import { sendError } from './supabase';
import { formatOpportunity, validateOpportunity } from './opportunity';

/** Validate the request body and insert an opportunity for the authenticated org. */
export async function createOpportunity(req, res, auth) {
  const { errors, row } = validateOpportunity(req.body || {});
  if (Object.keys(errors).length) return sendError(res, 422, 'Validation failed', errors);

  const { data, error } = await auth.supabase
    .from('opportunities')
    .insert({
      ...row,
      organization_id: auth.user.id, // always from the token, never from the request body
      status: 'open',
    })
    .select()
    .single();

  if (error) return sendError(res, 400, error.message);

  return res.status(201).json({
    success: true,
    data: formatOpportunity(data),
    message: 'Opportunity created',
  });
}
