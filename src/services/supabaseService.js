import { supabase } from '../lib/supabase';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Check if error is schema-related (should throw) or data-related (handle gracefully)
function isSchemaError(error) {
  if (!error) return false;

  if (error?.code && typeof error?.code === 'string') {
    const errorClass = error?.code?.substring(0, 2);
    if (errorClass === '42') return true; // Schema errors
    if (errorClass === '23') return false; // Data errors
    if (errorClass === '08') return true; // Connection errors
  }

  if (error?.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
      /invalid.*syntax/i,
      /type.*does not exist/i,
    ];
    return schemaErrorPatterns?.some(pattern => pattern?.test(error?.message));
  }

  return false;
}

// Get authenticated user
async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase?.auth?.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// =====================================================
// CATEGORIES SERVICE
// =====================================================

export const categoriesService = {
  // Get all categories for current user
  async getAll() {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('categories')?.select('*')?.eq('user_id', user?.id)?.is('deleted_at', null)?.order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Categories fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },

  // Create new category
  async create(categoryData) {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('categories')?.insert({
        user_id: user?.id,
        name: categoryData?.name,
        icon: categoryData?.icon || null
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  },

  // Update category
  async update(categoryId, updates) {
    try {
      const { data, error } = await supabase?.from('categories')?.update(updates)?.eq('id', categoryId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  },

  // Delete category
  async delete(categoryId) {
    try {
      const user = await getAuthenticatedUser();

      // Soft delete: set deleted_at and deleted_by
      const { data, error } = await supabase?.from('categories')?.update({
        deleted_at: new Date()?.toISOString(),
        deleted_by: user?.id
      })?.eq('id', categoryId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  },

  // Get deleted categories (for trash management)
  async getDeleted() {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('categories')?.select(`
          *,
          deleted_by_profile:user_profiles!categories_deleted_by_fkey(full_name)
        `)?.eq('user_id', user?.id)?.not('deleted_at', 'is', null)?.order('deleted_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Deleted categories fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get deleted categories error:', error);
      throw error;
    }
  },

  // Restore deleted category
  async restore(categoryId) {
    try {
      const { data, error } = await supabase?.from('categories')?.update({
        deleted_at: null,
        deleted_by: null
      })?.eq('id', categoryId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category restore error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Restore category error:', error);
      throw error;
    }
  },

  // Permanently delete category
  async permanentDelete(categoryId) {
    try {
      const { error } = await supabase?.from('categories')?.delete()?.eq('id', categoryId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category permanent delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permanent delete category error:', error);
      throw error;
    }
  },

  // Count products in deleted category
  async countProducts(categoryId) {
    try {
      const { count, error } = await supabase?.from('products')?.select('*', { count: 'exact', head: true })?.eq('category_id', categoryId)?.is('deleted_at', null);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Category product count error:', error?.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Count category products error:', error);
      throw error;
    }
  }
};

// =====================================================
// PRODUCTS SERVICE
// =====================================================

export const productsService = {
  // Get all products for current user
  async getAll() {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('products')?.select('*, categories(id, name, icon)')?.eq('user_id', user?.id)?.is('deleted_at', null)?.order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Products fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },

  // Get products by category
  async getByCategory(categoryId) {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('products')?.select('*')?.eq('user_id', user?.id)?.eq('category_id', categoryId)?.order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Products by category fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get products by category error:', error);
      throw error;
    }
  },

  // Create new product
  async create(productData) {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('products')?.insert({
        user_id: user?.id,
        category_id: productData?.categoryId,
        name: productData?.name,
        code: productData?.code,
        image: productData?.image || null,
        alt: productData?.alt || null,
        has_pdf: productData?.hasPdf || false,
        final_price: productData?.finalPrice || 0,
        cost: productData?.cost || 0,
        labor: productData?.labor || 0,
        profit: productData?.profit || 0
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Product create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  // Update product
  async update(productId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.categoryId !== undefined) dbUpdates.category_id = updates?.categoryId;
      if (updates?.name !== undefined) dbUpdates.name = updates?.name;
      if (updates?.code !== undefined) dbUpdates.code = updates?.code;
      if (updates?.image !== undefined) dbUpdates.image = updates?.image;
      if (updates?.alt !== undefined) dbUpdates.alt = updates?.alt;
      if (updates?.hasPdf !== undefined) dbUpdates.has_pdf = updates?.hasPdf;
      if (updates?.finalPrice !== undefined) dbUpdates.final_price = updates?.finalPrice;
      if (updates?.cost !== undefined) dbUpdates.cost = updates?.cost;
      if (updates?.labor !== undefined) dbUpdates.labor = updates?.labor;
      if (updates?.profit !== undefined) dbUpdates.profit = updates?.profit;

      const { data, error } = await supabase?.from('products')?.update(dbUpdates)?.eq('id', productId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Product update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  // Delete product
  async delete(productId) {
    try {
      const user = await getAuthenticatedUser();

      // Soft delete: set deleted_at and deleted_by
      const { data, error } = await supabase?.from('products')?.update({
        deleted_at: new Date()?.toISOString(),
        deleted_by: user?.id
      })?.eq('id', productId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Product delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  },

  // Get deleted products (for trash management)
  async getDeleted() {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('products')?.select(`
          *,
          categories(id, name, icon),
          deleted_by_profile:user_profiles!products_deleted_by_fkey(full_name)
        `)?.eq('user_id', user?.id)?.not('deleted_at', 'is', null)?.order('deleted_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Deleted products fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get deleted products error:', error);
      throw error;
    }
  },

  // Restore deleted product
  async restore(productId) {
    try {
      const { data, error } = await supabase?.from('products')?.update({
        deleted_at: null,
        deleted_by: null
      })?.eq('id', productId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Product restore error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Restore product error:', error);
      throw error;
    }
  },

  // Permanently delete product
  async permanentDelete(productId) {
    try {
      const { error } = await supabase?.from('products')?.delete()?.eq('id', productId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Product permanent delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permanent delete product error:', error);
      throw error;
    }
  }
};

// =====================================================
// PROJECTS SERVICE
// =====================================================

export const projectsService = {
  // Get all projects for current user
  async getAll() {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('projects')?.select('*')?.eq('user_id', user?.id)?.is('deleted_at', null)?.order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Projects fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  },

  // Get single project by ID
  async getById(projectId) {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('projects')?.select('*')?.eq('id', projectId)?.eq('user_id', user?.id)?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Project fetch error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get project error:', error);
      throw error;
    }
  },

  // Create new project
  async create(projectData) {
    try {
      const user = await getAuthenticatedUser();

      const { data, error } = await supabase?.from('projects')?.insert({
        user_id: user?.id,
        name: projectData?.name,
        description: projectData?.description || null,
        client: projectData?.client || null,
        project_type: projectData?.projectType || null,
        status: projectData?.status || 'active',
        start_date: projectData?.startDate || null,
        end_date: projectData?.endDate || null
        // subtotal, discount, total removed to rely on DB defaults (avoid schema error on create)
      })?.select()?.single();

      if (error) {
        // Handle Foreign Key Violation (Missing User Profile)
        if (error?.code === '23503') {
          console.warn('Missing user profile, attempting to fix...');
          const { error: profileError } = await supabase?.from('user_profiles')?.insert({
            id: user?.id,
            email: user?.email,
            full_name: user?.user_metadata?.full_name || 'Usuario'
          });

          if (!profileError) {
            // Retry project creation
            const { data: retryData, error: retryError } = await supabase?.from('projects')?.insert({
              user_id: user?.id,
              name: projectData?.name,
              description: projectData?.description || null,
              client: projectData?.client || null,
              project_type: projectData?.projectType || null,
              status: projectData?.status || 'active',
              start_date: projectData?.startDate || null,
              end_date: projectData?.endDate || null
            })?.select()?.single();

            if (retryError) throw retryError;
            return retryData;
          }
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  },

  // Update project
  async update(projectId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.name !== undefined) dbUpdates.name = updates?.name;
      if (updates?.description !== undefined) dbUpdates.description = updates?.description;
      if (updates?.client !== undefined) dbUpdates.client = updates?.client;
      if (updates?.projectType !== undefined) dbUpdates.project_type = updates?.projectType;
      if (updates?.status !== undefined) dbUpdates.status = updates?.status;
      if (updates?.startDate !== undefined) dbUpdates.start_date = updates?.startDate;
      if (updates?.endDate !== undefined) dbUpdates.end_date = updates?.endDate;

      // subtotal, discount, total temporarily removed until schema migration is verified
      /*
      if (updates?.subtotal !== undefined) dbUpdates.subtotal = updates?.subtotal;
      if (updates?.discount !== undefined) dbUpdates.discount = updates?.discount;
      if (updates?.total !== undefined) dbUpdates.total = updates?.total;
      */

      // If no valid updates, return early to avoid Supabase error
      if (Object.keys(dbUpdates).length === 0) {
        return null;
      }

      const { data, error } = await supabase?.from('projects')?.update(dbUpdates)?.eq('id', projectId)?.select()?.single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  },

  // Delete project
  async delete(projectId) {
    try {
      const user = await getAuthenticatedUser();

      const { error } = await supabase?.from('projects')?.update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id
      })?.eq('id', projectId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }
};

// =====================================================
// LINE ITEMS SERVICE
// =====================================================

export const lineItemsService = {
  // Get all line items for a project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase?.from('line_items')?.select('*')?.eq('project_id', projectId)?.order('created_at', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Line items fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get line items error:', error);
      throw error;
    }
  },

  // Create new line item
  async create(lineItemData) {
    try {
      const { data, error } = await supabase?.from('line_items')?.insert({
        project_id: lineItemData?.projectId,
        category: lineItemData?.category,
        name: lineItemData?.name,
        quantity: lineItemData?.quantity || 1,
        unit_cost: lineItemData?.unitCost || 0,
        labor: lineItemData?.labor || 0,
        markup: lineItemData?.markup || 0
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Line item create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create line item error:', error);
      throw error;
    }
  },

  // Update line item
  async update(lineItemId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.category !== undefined) dbUpdates.category = updates?.category;
      if (updates?.name !== undefined) dbUpdates.name = updates?.name;
      if (updates?.quantity !== undefined) dbUpdates.quantity = updates?.quantity;
      if (updates?.unitCost !== undefined) dbUpdates.unit_cost = updates?.unitCost;
      if (updates?.labor !== undefined) dbUpdates.labor = updates?.labor;
      if (updates?.markup !== undefined) dbUpdates.markup = updates?.markup;

      const { data, error } = await supabase?.from('line_items')?.update(dbUpdates)?.eq('id', lineItemId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Line item update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update line item error:', error);
      throw error;
    }
  },

  // Delete line item
  async delete(lineItemId) {
    try {
      const { error } = await supabase?.from('line_items')?.delete()?.eq('id', lineItemId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Line item delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete line item error:', error);
      throw error;
    }
  },

  // Replace all line items for a project (Snapshot save)
  async replaceForProject(projectId, items) {
    try {
      // 1. Delete all existing items
      const { error: deleteError } = await supabase?.from('line_items')?.delete()?.eq('project_id', projectId);

      if (deleteError) {
        throw deleteError;
      }

      if (!items || items.length === 0) return true;

      // 2. Prepare new items
      const dbItems = items.map(item => {
        const cost = Number(item?.cost) || 0;
        const price = Number(item?.unitPrice) || 0;
        // Avoid division by zero
        let markup = 0;
        if (cost > 0) {
          markup = ((price - cost) / cost) * 100;
          if (markup > 999.99) markup = 999.99;
        }

        return {
          project_id: projectId,
          category: item?.category || 'General',
          name: item?.name || 'Producto sin nombre',
          quantity: Number(item?.quantity) || 1,
          unit_cost: cost,
          labor: Number(item?.labor) || 0,
          markup: markup
        };
      });

      console.log('Saving items:', dbItems); // Debug log

      const { data, error: insertError } = await supabase?.from('line_items')?.insert(dbItems)?.select();

      if (insertError) {
        throw insertError;
      }

      return data;
    } catch (error) {
      console.error('Replace line items error:', error);
      throw error;
    }
  }
};

// =====================================================
// BUDGET CATEGORIES SERVICE
// =====================================================

export const budgetCategoriesService = {
  // Get all budget categories for a project
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase?.from('budget_categories')?.select('*')?.eq('project_id', projectId)?.order('created_at', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Budget categories fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get budget categories error:', error);
      throw error;
    }
  },

  // Create new budget category
  async create(budgetCategoryData) {
    try {
      const { data, error } = await supabase?.from('budget_categories')?.insert({
        project_id: budgetCategoryData?.projectId,
        name: budgetCategoryData?.name,
        allocated: budgetCategoryData?.allocated || 0,
        spent: budgetCategoryData?.spent || 0,
        color: budgetCategoryData?.color || null
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Budget category create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create budget category error:', error);
      throw error;
    }
  },

  // Update budget category
  async update(budgetCategoryId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.name !== undefined) dbUpdates.name = updates?.name;
      if (updates?.allocated !== undefined) dbUpdates.allocated = updates?.allocated;
      if (updates?.spent !== undefined) dbUpdates.spent = updates?.spent;
      if (updates?.color !== undefined) dbUpdates.color = updates?.color;

      const { data, error } = await supabase?.from('budget_categories')?.update(dbUpdates)?.eq('id', budgetCategoryId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Budget category update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update budget category error:', error);
      throw error;
    }
  },

  // Delete budget category
  async delete(budgetCategoryId) {
    try {
      const { error } = await supabase?.from('budget_categories')?.delete()?.eq('id', budgetCategoryId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Budget category delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete budget category error:', error);
      throw error;
    }
  }
};

// =====================================================
// MILESTONES SERVICE
// =====================================================

export const milestonesService = {
  // Get all milestones for a project with tasks
  async getByProject(projectId) {
    try {
      const { data, error } = await supabase?.from('milestones')?.select(`
          *,
          milestone_tasks(*)
        `)?.eq('project_id', projectId)?.order('start_date', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestones fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get milestones error:', error);
      throw error;
    }
  },

  // Create new milestone
  async create(milestoneData) {
    try {
      const { data, error } = await supabase?.from('milestones')?.insert({
        project_id: milestoneData?.projectId,
        title: milestoneData?.title,
        description: milestoneData?.description || null,
        start_date: milestoneData?.startDate || null,
        end_date: milestoneData?.endDate || null,
        status: milestoneData?.status || 'pending',
        progress: milestoneData?.progress || 0
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create milestone error:', error);
      throw error;
    }
  },

  // Update milestone
  async update(milestoneId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.title !== undefined) dbUpdates.title = updates?.title;
      if (updates?.description !== undefined) dbUpdates.description = updates?.description;
      if (updates?.startDate !== undefined) dbUpdates.start_date = updates?.startDate;
      if (updates?.endDate !== undefined) dbUpdates.end_date = updates?.endDate;
      if (updates?.status !== undefined) dbUpdates.status = updates?.status;
      if (updates?.progress !== undefined) dbUpdates.progress = updates?.progress;

      const { data, error } = await supabase?.from('milestones')?.update(dbUpdates)?.eq('id', milestoneId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update milestone error:', error);
      throw error;
    }
  },

  // Delete milestone
  async delete(milestoneId) {
    try {
      const { error } = await supabase?.from('milestones')?.delete()?.eq('id', milestoneId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete milestone error:', error);
      throw error;
    }
  }
};

// =====================================================
// MILESTONE TASKS SERVICE
// =====================================================

export const milestoneTasksService = {
  // Get all tasks for a milestone
  async getByMilestone(milestoneId) {
    try {
      const { data, error } = await supabase?.from('milestone_tasks')?.select('*')?.eq('milestone_id', milestoneId)?.order('created_at', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone tasks fetch error:', error?.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get milestone tasks error:', error);
      throw error;
    }
  },

  // Create new milestone task
  async create(taskData) {
    try {
      const { data, error } = await supabase?.from('milestone_tasks')?.insert({
        milestone_id: taskData?.milestoneId,
        name: taskData?.name,
        completed: taskData?.completed || false
      })?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone task create error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Create milestone task error:', error);
      throw error;
    }
  },

  // Update milestone task
  async update(taskId, updates) {
    try {
      const dbUpdates = {};
      if (updates?.name !== undefined) dbUpdates.name = updates?.name;
      if (updates?.completed !== undefined) dbUpdates.completed = updates?.completed;

      const { data, error } = await supabase?.from('milestone_tasks')?.update(dbUpdates)?.eq('id', taskId)?.select()?.single();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone task update error:', error?.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update milestone task error:', error);
      throw error;
    }
  },

  // Delete milestone task
  async delete(taskId) {
    try {
      const { error } = await supabase?.from('milestone_tasks')?.delete()?.eq('id', taskId);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('Milestone task delete error:', error?.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete milestone task error:', error);
      throw error;
    }
  }
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

// Subscribe to project changes
export const subscribeToProjects = (userId, callback) => {
  const subscription = supabase
    ?.channel('projects-changes')
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to specific project changes
export const subscribeToProject = (projectId, callback) => {
  const subscription = supabase
    ?.channel(`project-${projectId}-changes`)
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to budget categories changes for a project
export const subscribeToBudgetCategories = (projectId, callback) => {
  const subscription = supabase
    ?.channel(`budget-categories-${projectId}-changes`)
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'budget_categories',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to milestones changes for a project
export const subscribeToMilestones = (projectId, callback) => {
  const subscription = supabase
    ?.channel(`milestones-${projectId}-changes`)
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'milestones',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to milestone tasks changes
export const subscribeToMilestoneTasks = (milestoneId, callback) => {
  const subscription = supabase
    ?.channel(`milestone-tasks-${milestoneId}-changes`)
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'milestone_tasks',
        filter: `milestone_id=eq.${milestoneId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to line items changes for a project
export const subscribeToLineItems = (projectId, callback) => {
  const subscription = supabase
    ?.channel(`line-items-${projectId}-changes`)
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'line_items',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to products changes
export const subscribeToProducts = (userId, callback) => {
  const subscription = supabase
    ?.channel('products-changes')
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Subscribe to categories changes
export const subscribeToCategories = (userId, callback) => {
  const subscription = supabase
    ?.channel('categories-changes')
    ?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    ?.subscribe();

  return subscription;
};

// Unsubscribe helper
export const unsubscribeChannel = (subscription) => {
  if (subscription) {
    supabase?.removeChannel(subscription);
  }
};

// =====================================================
// TRASH MANAGEMENT SERVICE
// =====================================================

export const trashService = {
  // Empty trash (permanently delete all soft-deleted items)
  async emptyTrash() {
    try {
      const user = await getAuthenticatedUser();

      // Delete all soft-deleted products
      const { error: productsError } = await supabase?.from('products')?.delete()?.eq('user_id', user?.id)?.not('deleted_at', 'is', null);

      if (productsError) {
        if (isSchemaError(productsError)) throw productsError;
        console.error('Empty products trash error:', productsError?.message);
      }

      // Delete all soft-deleted categories
      const { error: categoriesError } = await supabase?.from('categories')?.delete()?.eq('user_id', user?.id)?.not('deleted_at', 'is', null);

      if (categoriesError) {
        if (isSchemaError(categoriesError)) throw categoriesError;
        console.error('Empty categories trash error:', categoriesError?.message);
      }

      return true;
    } catch (error) {
      console.error('Empty trash error:', error);
      throw error;
    }
  },

  // Get trash statistics
  async getStats() {
    try {
      const user = await getAuthenticatedUser();

      const { count: productsCount, error: productsError } = await supabase?.from('products')?.select('*', { count: 'exact', head: true })?.eq('user_id', user?.id)?.not('deleted_at', 'is', null);

      const { count: categoriesCount, error: categoriesError } = await supabase?.from('categories')?.select('*', { count: 'exact', head: true })?.eq('user_id', user?.id)?.not('deleted_at', 'is', null);

      if (productsError || categoriesError) {
        console.error('Trash stats error:', productsError || categoriesError);
        return { products: 0, categories: 0 };
      }

      return {
        products: productsCount || 0,
        categories: categoriesCount || 0
      };
    } catch (error) {
      console.error('Get trash stats error:', error);
      return { products: 0, categories: 0 };
    }
  }
};