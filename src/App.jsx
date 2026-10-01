import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('access_token') || ''
  })

  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const [editingId, setEditingId] = useState(null)

  const loadProducts = async (accessToken = token) => {
    if (!accessToken) {
      return
    }

    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Failed to load products.')
        return
      }

      setProducts(data.products || [])
    } catch (error) {
      console.error(error)
      setMessage('Cannot connect to the LavaLust API.')
    }
  }

  useEffect(() => {
    if (token) {
      loadProducts(token)
    }
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Login failed.')
        return
      }

      localStorage.setItem('access_token', data.tokens.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setToken(data.tokens.access_token)
      setUser(data.user)

      setEmail('')
      setPassword('')
      setMessage('')
    } catch (error) {
      console.error(error)
      setMessage('Cannot connect to the LavaLust API.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')

    setToken('')
    setUser(null)
    setProducts([])
    setMessage('')
  }

  const clearForm = () => {
    setProductName('')
    setDescription('')
    setPrice('')
    setQuantity('')
    setEditingId(null)
  }

  const handleSubmitProduct = async (e) => {
    e.preventDefault()
    setMessage('')

    const isEditing = editingId !== null

    const formProduct = {
      product_name: productName,
      description,
      price: Number(price),
      quantity: Number(quantity),
    }

    if (isEditing) {
      const oldProduct = products.find(
        (product) => product.id === editingId
      )

      const updatedProduct = {
        ...oldProduct,
        ...formProduct,
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingId ? updatedProduct : product
        )
      )

      clearForm()

      try {
        const response = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formProduct),
        })

        const data = await response.json()

        if (!response.ok) {
          setProducts((currentProducts) =>
            currentProducts.map((product) =>
              product.id === editingId ? oldProduct : product
            )
          )

          setMessage(data.message || 'Failed to update product.')
          return
        }

        setMessage('Product updated successfully.')

        loadProducts(token)
      } catch (error) {
        console.error(error)

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingId ? oldProduct : product
          )
        )

        setMessage('Cannot connect to the LavaLust API.')
      }

      return
    }

    const temporaryProduct = {
      id: `temp-${Date.now()}`,
      ...formProduct,
    }

    setProducts((currentProducts) => [
      temporaryProduct,
      ...currentProducts,
    ])

    clearForm()

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formProduct),
      })

      const data = await response.json()

      if (!response.ok) {
        setProducts((currentProducts) =>
          currentProducts.filter(
            (product) => product.id !== temporaryProduct.id
          )
        )

        setMessage(data.message || 'Failed to add product.')
        return
      }

      setMessage('Product added successfully.')

      loadProducts(token)
    } catch (error) {
      console.error(error)

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== temporaryProduct.id
        )
      )

      setMessage('Cannot connect to the LavaLust API.')
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)

    setProductName(product.product_name)
    setDescription(product.description || '')
    setPrice(product.price)
    setQuantity(product.quantity)

    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this product?')

    if (!confirmed) {
      return
    }

    const deletedProduct = products.find(
      (product) => product.id === id
    )

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    )

    if (editingId === id) {
      clearForm()
    }

    setMessage('')

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setProducts((currentProducts) => [
          deletedProduct,
          ...currentProducts,
        ])

        setMessage(data.message || 'Failed to delete product.')
        return
      }

      setMessage('Product deleted successfully.')

      loadProducts(token)
    } catch (error) {
      console.error(error)

      setProducts((currentProducts) => [
        deletedProduct,
        ...currentProducts,
      ])

      setMessage('Cannot connect to the LavaLust API.')
    }
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">PM</div>

          <p className="login-kicker">
            PRODUCT MANAGEMENT SYSTEM
          </p>

          <h1>Welcome Back</h1>

          <p className="login-subtitle">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {message && <p className="error">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo">PM</div>

          <div>
            <p className="header-label">PRODUCT MANAGEMENT</p>
            <h1>Admin Dashboard</h1>
          </div>
        </div>

        <div className="header-right">
          <div className="admin-info">
            <div className="admin-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>Welcome, {user.username}!</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="top-section">
          <div>
            <p className="page-label">DASHBOARD</p>
            <h2>Product Management</h2>

            <p className="page-description">
              Add, edit, and manage your products here.
            </p>
          </div>

          <div className="total-card">
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
        </section>

        <section className="form-card">
          <form onSubmit={handleSubmitProduct}>
            <div className="form-field">
              <label>Product Name</label>

              <input
                type="text"
                placeholder="Product name"
                value={productName}
                onChange={(e) =>
                  setProductName(e.target.value)
                }
                required
              />
            </div>

            <div className="form-field">
              <label>Price</label>

              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-field">
              <label>Quantity</label>

              <input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value)
                }
                min="0"
                required
              />
            </div>

            <div className="form-field description-field">
              <label>Description</label>

              <textarea
                placeholder="Product description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              ></textarea>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
              >
                {editingId !== null
                  ? 'Update Product'
                  : 'Add Product'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={clearForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {message && (
          <p
            className={
              message
                .toLowerCase()
                .includes('successfully')
                ? 'success'
                : 'error'
            }
          >
            {message}
          </p>
        )}

        <section className="list-card">
          <div className="section-heading list-header">
            <div>
              <h3>Product List</h3>

              <p>
                All products currently stored in the system.
              </p>
            </div>

            <div className="product-number">
              {products.length}{' '}
              {products.length === 1
                ? 'Product'
                : 'Products'}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">+</div>

              <h4>No Products Yet</h4>

              <p>Add a product to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="id-badge">
                          {String(product.id).startsWith('temp-')
                            ? 'New'
                            : `#${product.id}`}
                        </span>
                      </td>

                      <td>
                        <div className="product-name">
                          <div className="product-avatar">
                            {product.product_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>
                            {product.product_name}
                          </strong>
                        </div>
                      </td>

                      <td className="description-text">
                        {product.description ||
                          'No description'}
                      </td>

                      <td className="price-text">
                        ₱
                        {Number(product.price).toFixed(2)}
                      </td>

                      <td>
                        <span className="quantity-badge">
                          {product.quantity}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() =>
                              handleEdit(product)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(product.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">
          <span>Product Management System</span>
          <span>React + LavaLust API</span>
        </footer>
      </main>
    </div>
  )
}

export default App