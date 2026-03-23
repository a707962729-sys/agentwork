# 测试模板

## Jest/TypeScript 单元测试

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new UserService(mockRepo);
  });

  describe('findById', () => {
    it('应该返回用户信息', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Test' };
      mockRepo.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });

    it('用户不存在时应该返回 null', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await service.findById(999);
      expect(result).toBeNull();
    });
  });
});
```

---

## Pytest 单元测试

```python
import pytest
from unittest.mock import Mock, patch
from services.user_service import UserService

class TestUserService:
    @pytest.fixture
    def service(self):
        mock_repo = Mock()
        return UserService(mock_repo)

    def test_find_by_id_returns_user(self, service):
        # Arrange
        service.repo.find_by_id.return_value = {"id": 1, "name": "Test"}

        # Act
        result = service.find_by_id(1)

        # Assert
        assert result["name"] == "Test"
        service.repo.find_by_id.assert_called_once_with(1)

    def test_find_by_id_returns_none_when_not_found(self, service):
        service.repo.find_by_id.return_value = None
        result = service.find_by_id(999)
        assert result is None
```

---

## Go 单元测试

```go
package service

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

type MockRepo struct {
    mock.Mock
}

func (m *MockRepo) FindById(id int) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

func TestUserService_FindById(t *testing.T) {
    mockRepo := new(MockRepo)
    service := NewUserService(mockRepo)

    t.Run("应该返回用户信息", func(t *testing.T) {
        expectedUser := &User{ID: 1, Name: "Test"}
        mockRepo.On("FindById", 1).Return(expectedUser, nil)

        result, err := service.FindById(1)

        assert.NoError(t, err)
        assert.Equal(t, expectedUser, result)
        mockRepo.AssertExpectations(t)
    })
}
```

---

## API 集成测试

```typescript
import request from 'supertest';
import app from '../app';

describe('User API', () => {
  describe('GET /api/users/:id', () => {
    it('应该返回 200 和用户信息', async () => {
      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
    });

    it('用户不存在应该返回 404', async () => {
      const response = await request(app).get('/api/users/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('应该创建用户并返回 201', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'New User', email: 'new@example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });
});
```