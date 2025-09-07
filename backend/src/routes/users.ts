import { Router } from 'express';

const router = Router();

/**
 * 取得使用者列表
 */
router.get('/', async (req, res) => {
  // TODO: 實作使用者列表查詢
  res.json({
    success: true,
    message: '使用者列表功能開發中',
    data: []
  });
});

/**
 * 建立使用者
 */
router.post('/', async (req, res) => {
  // TODO: 實作使用者建立
  res.json({
    success: true,
    message: '使用者建立功能開發中',
    data: null
  });
});

/**
 * 取得使用者詳情
 */
router.get('/:id', async (req, res) => {
  // TODO: 實作使用者詳情查詢
  res.json({
    success: true,
    message: '使用者詳情功能開發中',
    data: null
  });
});

/**
 * 更新使用者
 */
router.put('/:id', async (req, res) => {
  // TODO: 實作使用者更新
  res.json({
    success: true,
    message: '使用者更新功能開發中',
    data: null
  });
});

/**
 * 刪除使用者
 */
router.delete('/:id', async (req, res) => {
  // TODO: 實作使用者刪除
  res.json({
    success: true,
    message: '使用者刪除功能開發中',
    data: null
  });
});

export { router as userRoutes };