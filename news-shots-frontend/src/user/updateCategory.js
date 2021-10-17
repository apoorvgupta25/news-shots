import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';

import {isAuth} from '../auth/authAPICalls';
import {updateCategory, getCategory} from './helper/categoryAPICalls';

const UpdateCategory = ({match}) => {

    const [name, setName] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    const {user, token} = isAuth();

    const handleChange = event => {
        setError("");
        setName(event.target.value);
    }

    const successMessage = () => {
        if(success){
            return <h4 className="text-success">Category updated Succesefully</h4>
        }
    }

    const warningMessage = () => {
        if(error){
            return <h4 className="text-danger">Failed to Update Category</h4>
        }
    }

    const preload = categoryId => {
        getCategory(categoryId)
        .then(data => {
            if(data.error){
                setError(true)
            }
            else{
                setError("");
                setName(data.name);
            }
        })

    }

    useEffect(() => {
        preload(match.params.categoryId);
    }, [])

    const onSubmit = event => {
        event.preventDefault();
        setError("");
        setSuccess(false);
        updateCategory(match.params.categoryId, user._id, token, {name})
        .then(data => {
            if(data.error){
                setError(true)
            }
            else{
                setError("");
                setSuccess(true);
                setName("");
            }
        })
    }

    const goBack = () => (
        <div className="mt-5">
            <Link className="btn btn-sm btn-success mb-3" to={`/dashboard/${user._id}`}>Admin Home</Link>
        </div>
    )

    return (
        <div className="container bg-info p-4">
            <div className="row bg-white rounded">
                <div className="col-md-2 ">
                    {goBack()}
                </div>

                <div className="col-md-10">
                    {successMessage()}
                    {warningMessage()}
                    <form>
                        <div className="form-group py-2">
                            <p className="lead">Enter the Category Name</p>
                            <input type="text" className="form-control my-3" onChange={handleChange} value={name} autoFocus required placeholder="For Ex. Summer"/>
                            <button className="btn btn-outline-info" onClick={onSubmit}>Update Category</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
}

export default UpdateCategory;