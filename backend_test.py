import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class FinanceTrackerAPITester:
    def __init__(self, base_url="https://expense-sync-pro.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_accounts = []
        self.created_transactions = []
        self.created_recurring = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Test User",
                "email": test_email,
                "password": "TestPass123!"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_success, reg_response = self.run_test(
            "Registration for Login Test",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Login Test User",
                "email": test_email,
                "password": "LoginTest123!"
            }
        )
        
        if not reg_success:
            return False
            
        # Now test login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": test_email,
                "password": "LoginTest123!"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Logged in user: {test_email}")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'id' in response

    def test_create_account(self, name, account_type, balance=1000.0):
        """Test creating an account"""
        success, response = self.run_test(
            f"Create {account_type} Account",
            "POST",
            "accounts",
            200,
            data={
                "name": name,
                "type": account_type,
                "initial_balance": balance,
                "currency": "USD"
            }
        )
        if success and 'id' in response:
            self.created_accounts.append(response['id'])
            print(f"   Created account: {name} (ID: {response['id']})")
            return response['id']
        return None

    def test_get_accounts(self):
        """Test getting all accounts"""
        success, response = self.run_test(
            "Get All Accounts",
            "GET",
            "accounts",
            200
        )
        return success and isinstance(response, list)

    def test_create_transaction(self, account_id, tx_type, category, amount):
        """Test creating a transaction"""
        success, response = self.run_test(
            f"Create {tx_type} Transaction",
            "POST",
            "transactions",
            200,
            data={
                "account_id": account_id,
                "type": tx_type,
                "category": category,
                "amount": amount,
                "description": f"Test {tx_type} transaction"
            }
        )
        if success and 'id' in response:
            self.created_transactions.append(response['id'])
            print(f"   Created transaction: {category} ${amount}")
            return response['id']
        return None

    def test_get_transactions(self):
        """Test getting all transactions"""
        success, response = self.run_test(
            "Get All Transactions",
            "GET",
            "transactions",
            200
        )
        return success and isinstance(response, list)

    def test_create_recurring_transaction(self, account_id):
        """Test creating a recurring transaction"""
        start_date = datetime.now().strftime('%Y-%m-%d')
        success, response = self.run_test(
            "Create Recurring Transaction",
            "POST",
            "recurring-transactions",
            200,
            data={
                "account_id": account_id,
                "type": "expense",
                "category": "Rent",
                "amount": 1200.0,
                "description": "Monthly rent payment",
                "frequency": "monthly",
                "start_date": start_date
            }
        )
        if success and 'id' in response:
            self.created_recurring.append(response['id'])
            print(f"   Created recurring transaction: Rent $1200")
            return response['id']
        return None

    def test_execute_recurring_transactions(self):
        """Test executing recurring transactions"""
        success, response = self.run_test(
            "Execute Recurring Transactions",
            "POST",
            "recurring-transactions/execute",
            200
        )
        return success and 'message' in response

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        success, response = self.run_test(
            "Dashboard Summary",
            "GET",
            "dashboard/summary",
            200
        )
        expected_keys = ['total_balance', 'total_income', 'total_expenses', 'net_savings']
        return success and all(key in response for key in expected_keys)

    def test_generate_report(self, delivery_method):
        """Test report generation"""
        success, response = self.run_test(
            f"Generate {delivery_method.upper()} Report",
            "POST",
            "reports/generate",
            200 if delivery_method != 'email' else 500,  # Email should fail without API key
            data={
                "month": datetime.now().month,
                "year": datetime.now().year,
                "delivery_method": delivery_method
            }
        )
        
        if delivery_method == 'email':
            # Email should fail due to no API key
            return not success  # We expect this to fail
        elif delivery_method == 'pdf':
            return success and 'pdf_data' in response
        elif delivery_method == 'in-app':
            return success and 'html_content' in response
        
        return success

    def test_delete_transaction(self, transaction_id):
        """Test deleting a transaction"""
        success, response = self.run_test(
            "Delete Transaction",
            "DELETE",
            f"transactions/{transaction_id}",
            200
        )
        return success

    def test_delete_account(self, account_id):
        """Test deleting an account"""
        success, response = self.run_test(
            "Delete Account",
            "DELETE",
            f"accounts/{account_id}",
            200
        )
        return success

    def cleanup(self):
        """Clean up created resources"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete transactions first
        for tx_id in self.created_transactions:
            self.test_delete_transaction(tx_id)
        
        # Delete recurring transactions
        for rt_id in self.created_recurring:
            self.run_test("Delete Recurring", "DELETE", f"recurring-transactions/{rt_id}", 200)
        
        # Delete accounts last
        for acc_id in self.created_accounts:
            self.test_delete_account(acc_id)

def main():
    print("🚀 Starting Finance Tracker API Tests")
    print("=" * 50)
    
    tester = FinanceTrackerAPITester()
    
    try:
        # Authentication Tests
        print("\n📝 AUTHENTICATION TESTS")
        if not tester.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return 1
        
        if not tester.test_get_current_user():
            print("❌ Get current user failed")
            return 1
        
        # Test login with different user
        if not tester.test_user_login():
            print("❌ Login test failed")
            return 1
        
        # Account Management Tests
        print("\n🏦 ACCOUNT MANAGEMENT TESTS")
        checking_id = tester.test_create_account("Test Checking", "checking", 2000.0)
        savings_id = tester.test_create_account("Test Savings", "savings", 5000.0)
        credit_id = tester.test_create_account("Test Credit", "credit", -500.0)
        
        if not all([checking_id, savings_id, credit_id]):
            print("❌ Account creation failed")
            return 1
        
        if not tester.test_get_accounts():
            print("❌ Get accounts failed")
            return 1
        
        # Transaction Tests
        print("\n💰 TRANSACTION TESTS")
        income_tx = tester.test_create_transaction(checking_id, "income", "Salary", 3000.0)
        expense_tx = tester.test_create_transaction(checking_id, "expense", "Groceries", 150.0)
        
        if not all([income_tx, expense_tx]):
            print("❌ Transaction creation failed")
            return 1
        
        if not tester.test_get_transactions():
            print("❌ Get transactions failed")
            return 1
        
        # Recurring Transaction Tests
        print("\n🔄 RECURRING TRANSACTION TESTS")
        recurring_id = tester.test_create_recurring_transaction(checking_id)
        if not recurring_id:
            print("❌ Recurring transaction creation failed")
            return 1
        
        if not tester.test_execute_recurring_transactions():
            print("❌ Execute recurring transactions failed")
            return 1
        
        # Dashboard Tests
        print("\n📊 DASHBOARD TESTS")
        if not tester.test_dashboard_summary():
            print("❌ Dashboard summary failed")
            return 1
        
        # Report Tests
        print("\n📄 REPORT TESTS")
        if not tester.test_generate_report("in-app"):
            print("❌ In-app report generation failed")
            return 1
        
        if not tester.test_generate_report("pdf"):
            print("❌ PDF report generation failed")
            return 1
        
        # Test email report (should fail without API key)
        if not tester.test_generate_report("email"):
            print("✅ Email report correctly failed (no API key configured)")
        else:
            print("⚠️  Email report unexpectedly succeeded")
        
        # Cleanup
        tester.cleanup()
        
        # Print results
        print(f"\n📊 FINAL RESULTS")
        print("=" * 50)
        print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"Success rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! Backend API is working well")
            return 0
        elif success_rate >= 70:
            print("⚠️  Good, but some issues need attention")
            return 0
        else:
            print("❌ Multiple issues found, needs investigation")
            return 1
            
    except Exception as e:
        print(f"💥 Test suite crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())